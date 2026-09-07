export type LocationQualityTier = "premium" | "standard" | "lower_ranked" | "review";

export type LocationQualityBreakdown = {
  total: number;
  tier: LocationQualityTier;
  rating: number;
  reviewVolume: number;
  completeness: number;
  photos: number;
  contactAndHours: number;
  booking: number;
  enrichment: number;
  specificity: number;
  freshness: number;
};

const text = (value: unknown) => String(value ?? "").trim();
const lower = (value: unknown) => text(value).toLowerCase();
const number = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function present(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
  return text(value).length > 0;
}

function arrayCount(...values: unknown[]) {
  const items = values.flatMap((value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch {}
      return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
    }
    return [];
  });
  return new Set(items.map((item) => typeof item === "string" ? item : JSON.stringify(item))).size;
}

function ratingScore(row: Record<string, any>) {
  const rating = number(row.rating ?? row.google_rating);
  if (rating >= 4.7) return 20;
  if (rating >= 4.5) return 17;
  if (rating >= 4.3) return 14;
  if (rating >= 4.0) return 10;
  if (rating >= 3.8) return 7;
  if (rating >= 3.5) return 4;
  return 0;
}

function reviewVolumeScore(row: Record<string, any>) {
  const reviews = Math.max(0, number(row.review_count ?? row.google_user_rating_count ?? row.user_ratings_total));
  if (reviews >= 500) return 20;
  if (reviews >= 250) return 18;
  if (reviews >= 100) return 16;
  if (reviews >= 50) return 13;
  if (reviews >= 25) return 10;
  if (reviews >= 10) return 7;
  if (reviews >= 1) return 4;
  return 0;
}

function completenessScore(row: Record<string, any>) {
  let score = 0;
  if (present(row.name || row.restaurant_name || row.activity_name)) score += 3;
  if (present(row.address || row.formatted_address)) score += 3;
  if (present(row.city) && present(row.state)) score += 3;
  if (row.latitude != null && row.longitude != null) score += 3;
  if (present(row.primary_category || row.cuisine || row.cuisine_type || row.activity_type || row.primary_tag || row.location_type)) score += 3;
  return score;
}

function photoScore(row: Record<string, any>) {
  const count = Math.max(
    arrayCount(row.images, row.gallery_images, row.photos, row.gallery, row.image_gallery, row.photo_urls, row.gallery_image_urls),
    present(row.main_image || row.image_url || row.photo_url || row.primary_photo_url) ? 1 : 0,
  );
  if (count >= 4) return 10;
  if (count >= 2) return 7;
  if (count >= 1 || row.has_photos === true) return 4;
  return 0;
}

function contactAndHoursScore(row: Record<string, any>) {
  let score = 0;
  const hours = row.hours || row.business_hours || row.opening_hours || row.current_opening_hours || row.regularOpeningHours || row.weekday_text;
  if (present(hours)) score += 4;
  if (present(row.phone || row.formatted_phone_number || row.international_phone_number)) score += 2;
  if (present(row.website || row.websiteUri)) score += 2;
  if (present(row.instagram || row.instagram_url || row.facebook || row.facebook_url || row.tiktok || row.tiktok_url)) score += 1;
  if (present(row.price_level || row.priceLevel || row.price_range || row.priceRange)) score += 1;
  return score;
}

function bookingScore(row: Record<string, any>) {
  const hasBooking = present(
    row.reservation_url ||
      row.booking_url ||
      row.reserve_url ||
      row.resy_url ||
      row.opentable_url ||
      row.exploretock_url ||
      row.ticket_url ||
      row.booking_link,
  );
  return hasBooking || row.reservable === true ? 5 : 0;
}

function enrichmentScore(row: Record<string, any>) {
  let score = 0;
  const googleStatus = lower(row.google_enrichment_status);
  const sourceQuality = lower(row.source_quality_status);
  const confidence = lower(row.import_confidence);
  if (["approved", "completed", "enriched", "success"].includes(googleStatus) || present(row.google_enriched_at)) score += 5;
  if (["enriched", "verified", "trusted", "high_quality"].includes(sourceQuality)) score += 3;
  else if (sourceQuality && !["imported_unverified", "low_level_review", "needs_enrichment"].includes(sourceQuality)) score += 1;
  if (confidence === "high") score += 2;
  else if (confidence === "medium") score += 1;
  return score;
}

function specificityScore(row: Record<string, any>) {
  const primary = lower(row.primary_category || row.cuisine || row.cuisine_type || row.activity_type || row.primary_tag);
  const generic = ["", "restaurant", "activity", "food", "dining", "entertainment", "nightlife", "bar"];
  let score = generic.includes(primary) ? (primary ? 1 : 0) : 3;
  const tags = arrayCount(row.tags, row.vibe_tags, row.best_for_tags, row.search_keywords, row.google_types, row.signature_items, row.special_features);
  if (tags >= 4) score += 2;
  else if (tags >= 1) score += 1;
  return Math.min(5, score);
}

function freshnessScore(row: Record<string, any>) {
  const raw = row.last_enriched_at || row.google_enriched_at || row.last_quality_check_at || row.updated_at || row.modified_at;
  if (!raw) return 0;
  const timestamp = new Date(String(raw)).getTime();
  if (!Number.isFinite(timestamp)) return 0;
  const ageDays = Math.max(0, (Date.now() - timestamp) / 86_400_000);
  if (ageDays <= 30) return 5;
  if (ageDays <= 90) return 4;
  if (ageDays <= 180) return 3;
  if (ageDays <= 365) return 2;
  return 1;
}

export function qualityTierForScore(score: number): LocationQualityTier {
  if (score >= 80) return "premium";
  if (score >= 65) return "standard";
  if (score >= 50) return "lower_ranked";
  return "review";
}

export function qualitySearchAdjustment(score: number) {
  const tier = qualityTierForScore(score);
  if (tier === "premium") return 10;
  if (tier === "standard") return 4;
  if (tier === "lower_ranked") return -8;
  return -100;
}

export function calculateLocationQualityBreakdown(row: Record<string, any>): LocationQualityBreakdown {
  const rating = ratingScore(row);
  const reviewVolume = reviewVolumeScore(row);
  const completeness = completenessScore(row);
  const photos = photoScore(row);
  const contactAndHours = contactAndHoursScore(row);
  const booking = bookingScore(row);
  const enrichment = enrichmentScore(row);
  const specificity = specificityScore(row);
  const freshness = freshnessScore(row);
  const total = Math.max(0, Math.min(100, rating + reviewVolume + completeness + photos + contactAndHours + booking + enrichment + specificity + freshness));
  return {
    total,
    tier: qualityTierForScore(total),
    rating,
    reviewVolume,
    completeness,
    photos,
    contactAndHours,
    booking,
    enrichment,
    specificity,
    freshness,
  };
}

export function calculateLocationQuality(row: Record<string, any>) {
  return calculateLocationQualityBreakdown(row).total;
}
