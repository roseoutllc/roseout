import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { evaluateGoogleDiscoveryCandidate } from "@/lib/location-growth/googleDiscoveryQuality";
import { publishReadyStagedLocations } from "@/lib/location-growth/publishReady";

const SOURCE = "google_curated_discovery";

const REVIEW_ATTENTION_REASONS = new Set([
  "missing_rating",
  "missing_reviews",
  "rating_below_floor",
  "reviews_below_floor",
  "chain_or_qsr",
  "quick_service",
  "missing_location",
  "needs_photo",
  "needs_website",
  "needs_hours",
  "subjective_hidden_gem_requires_review",
  "quick_service_search_only",
  "weak_outing_evidence",
  "category_mismatch",
  "category_evidence_missing",
  "quality_score_below_curated_threshold",
]);

type Candidate = {
  id: string;
  batch_id: string;
  source_id: string;
  location_type?: string | null;
  name?: string | null;
  restaurant_name?: string | null;
  activity_name?: string | null;
  primary_tag?: string | null;
  primary_category?: string | null;
  rating?: number | null;
  review_count?: number | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  google_types?: string[] | null;
  main_image?: string | null;
  images?: string[] | null;
  raw_payload?: Record<string, unknown> | null;
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function recordValue(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, any>
    : {};
}

function hasHours(value: Record<string, any>) {
  const candidates = [
    value.opening_hours,
    value.current_opening_hours,
    value.regularOpeningHours,
    value.business_hours,
    value.hours,
    value.weekday_text,
  ];
  return candidates.some((candidate) => {
    if (!candidate) return false;
    if (Array.isArray(candidate)) return candidate.length > 0;
    if (typeof candidate === "object") return Object.keys(candidate).length > 0;
    return clean(candidate).length > 0;
  });
}

function toBoolean(value: unknown) {
  return value === true ? true : value === false ? false : null;
}

function reviewReasonFor(quality: ReturnType<typeof evaluateGoogleDiscoveryCandidate>) {
  const reasons = Array.from(new Set(quality.reasons.filter((reason) => REVIEW_ATTENTION_REASONS.has(reason))));
  if (reasons.length) return reasons.join(",");
  return quality.decision === "reject"
    ? "quality_score_below_curated_threshold"
    : "curated_manual_review";
}

function evaluateStoredCandidate(candidate: Candidate) {
  const raw = recordValue(candidate.raw_payload);
  const google = recordValue(raw.google);
  const gap = recordValue(raw.gap);
  const kind = candidate.location_type === "restaurant" ? "restaurant" : "activity";
  const category = clean(gap.category || candidate.primary_tag || candidate.primary_category);
  const types = Array.isArray(google.types)
    ? google.types.map((value: unknown) => clean(value)).filter(Boolean)
    : Array.isArray(candidate.google_types)
      ? candidate.google_types
      : [];
  const photos = Array.isArray(google.photos) ? google.photos : [];
  const hasPhoto = Boolean(clean(candidate.main_image) || candidate.images?.length || photos.length);

  return evaluateGoogleDiscoveryCandidate({
    kind,
    name: clean(candidate.name || candidate.restaurant_name || candidate.activity_name),
    query: clean(raw.query),
    category,
    rating: Number(candidate.rating || google.rating || 0),
    reviewCount: Number(candidate.review_count || google.user_ratings_total || google.review_count || 0),
    types,
    editorialSummary: clean(google.editorial_summary?.overview) || null,
    hasPhoto,
    hasPhone: Boolean(clean(candidate.phone || google.formatted_phone_number || google.international_phone_number)),
    hasWebsite: Boolean(clean(candidate.website || google.website || google.websiteUri)),
    hasHours: hasHours(google),
    hasLocation: Boolean(
      clean(candidate.address) &&
      clean(candidate.city) &&
      clean(candidate.state) &&
      Number.isFinite(Number(candidate.latitude)) &&
      Number.isFinite(Number(candidate.longitude)),
    ),
    dineIn: toBoolean(google.dineIn),
    takeout: toBoolean(google.takeout),
    delivery: toBoolean(google.delivery),
    curbsidePickup: toBoolean(google.curbsidePickup),
    reservable: toBoolean(google.reservable),
    goodForGroups: toBoolean(google.goodForGroups),
    outdoorSeating: toBoolean(google.outdoorSeating),
    liveMusic: toBoolean(google.liveMusic),
    servesCocktails: toBoolean(google.servesCocktails),
    servesWine: toBoolean(google.servesWine),
  });
}

export async function promoteStoredGoogleReviewCandidates({
  limit = 200,
  publish = true,
  locationType,
}: {
  limit?: number;
  publish?: boolean;
  locationType?: "restaurant" | "activity";
} = {}) {
  const safeLimit = Math.min(500, Math.max(1, Math.trunc(Number(limit) || 200)));
  let query = supabaseAdmin
    .from("location_import_staging")
    .select("id,batch_id,source_id,location_type,name,restaurant_name,activity_name,primary_tag,primary_category,rating,review_count,phone,website,address,city,state,latitude,longitude,google_types,main_image,images,raw_payload")
    .eq("source", SOURCE)
    .eq("import_status", "staged")
    .eq("duplicate_status", "unique")
    .eq("quality_status", "review")
    .eq("photo_status", "google_live_proxy");

  if (locationType) query = query.eq("location_type", locationType);

  const { data, error } = await query
    .order("quality_score", { ascending: false })
    .limit(safeLimit);

  if (error) throw new Error(`Unable to load stored Google review candidates: ${error.message}`);

  const promotedByBatch = new Map<string, number>();
  const retainedReasonCounts: Record<string, number> = {};
  const rejectedReasonCounts: Record<string, number> = {};
  let scanned = 0;
  let promoted = 0;
  let rejected = 0;
  let retainedForReview = 0;
  const errors: string[] = [];

  for (const candidate of (data || []) as Candidate[]) {
    scanned += 1;
    const quality = evaluateStoredCandidate(candidate);

    if (quality.decision === "reject") {
      const rejectionReason = reviewReasonFor(quality);
      rejectedReasonCounts[rejectionReason] = (rejectedReasonCounts[rejectionReason] || 0) + 1;
      const { error: rejectUpdateError } = await supabaseAdmin
        .from("location_import_staging")
        .update({
          import_status: "rejected",
          quality_status: "reject",
          quality_score: quality.score,
          curation_tier: "rejected",
          public_visibility_tier: "hidden",
          source_quality_status: "curated_google_rejected",
          rejection_reason: rejectionReason,
          low_level_reason: rejectionReason,
          low_level_detected_at: new Date().toISOString(),
          low_level_source: SOURCE,
          updated_at: new Date().toISOString(),
        })
        .eq("id", candidate.id)
        .eq("source", SOURCE)
        .eq("import_status", "staged")
        .eq("duplicate_status", "unique")
        .eq("quality_status", "review");

      if (rejectUpdateError) {
        errors.push(`${candidate.name || candidate.source_id}: ${rejectUpdateError.message}`);
      } else {
        rejected += 1;
      }
      continue;
    }

    if (quality.decision === "review") {
      const reviewReason = reviewReasonFor(quality);
      retainedReasonCounts[reviewReason] = (retainedReasonCounts[reviewReason] || 0) + 1;
      const { error: reviewUpdateError } = await supabaseAdmin
        .from("location_import_staging")
        .update({
          quality_score: quality.score,
          rejection_reason: reviewReason,
          source_quality_status: "curated_google_review",
          updated_at: new Date().toISOString(),
        })
        .eq("id", candidate.id)
        .eq("source", SOURCE)
        .eq("import_status", "staged")
        .eq("duplicate_status", "unique")
        .eq("quality_status", "review");

      if (reviewUpdateError) {
        errors.push(`${candidate.name || candidate.source_id}: ${reviewUpdateError.message}`);
      }
      retainedForReview += 1;
      continue;
    }

    const { error: updateError } = await supabaseAdmin
      .from("location_import_staging")
      .update({
        quality_status: "publish_ready",
        quality_score: quality.score,
        curation_tier: "curated",
        import_confidence: "high",
        source_quality_status: "curated_google",
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidate.id)
      .eq("source", SOURCE)
      .eq("import_status", "staged")
      .eq("duplicate_status", "unique")
      .eq("quality_status", "review");

    if (updateError) {
      errors.push(`${candidate.name || candidate.source_id}: ${updateError.message}`);
      continue;
    }

    promoted += 1;
    promotedByBatch.set(candidate.batch_id, (promotedByBatch.get(candidate.batch_id) || 0) + 1);
  }

  let published = 0;
  let markedPublished = 0;
  let skipped = 0;
  if (publish) {
    for (const [batchId, batchCount] of promotedByBatch.entries()) {
      const result = await publishReadyStagedLocations({ batchId, limit: batchCount });
      published += result.inserted;
      markedPublished += result.markedPublished;
      skipped += result.skipped;
      errors.push(...result.errors.map((message) => `${batchId}: ${message}`));
    }
  }

  return {
    scanned,
    promoted,
    rejected,
    rejectedReasonCounts,
    retainedForReview,
    retainedReasonCounts,
    published,
    markedPublished,
    skipped,
    batches: promotedByBatch.size,
    locationType: locationType || "all",
    googleApiCalls: 0,
    errors,
  };
}
