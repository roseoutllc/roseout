import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClaimQr } from "@/lib/claimQr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const SPECIALTY_QUERIES: Record<string, string[]> = {
  hookah: [
    "hookah lounge",
    "hookah bar",
    "hookah cafe",
    "shisha lounge",
    "cigar lounge",
  ],
  nightlife: [
    "rooftop lounge",
    "speakeasy",
    "cocktail lounge",
    "jazz lounge",
    "live music lounge",
    "karaoke lounge",
  ],
  games: [
    "bowling alley",
    "arcade bar",
    "escape room",
    "axe throwing",
    "paintball",
    "laser tag",
    "mini golf",
    "pool hall",
    "billiards lounge",
  ],
  creative: [
    "paint and sip",
    "pottery class",
    "candle making",
    "perfume making",
    "cooking class",
    "dance class",
    "art class",
  ],
  wellness: [
    "couples spa",
    "spa",
    "massage spa",
    "sauna",
    "wellness lounge",
  ],
  culture: [
    "museum",
    "art gallery",
    "immersive experience",
    "immersive exhibit",
    "jazz club",
    "poetry lounge",
    "indie movie theater",
  ],
  romantic: [
    "wine tasting",
    "rooftop cinema",
    "dinner cruise",
    "sunset cruise",
    "candlelight concert",
  ],
  outdoor: [
    "kayaking",
    "bike rental",
    "skating rink",
    "outdoor movie",
    "holiday market",
    "botanical garden",
  ],
};

function isAuthorized(request: NextRequest) {
  const importSecret = process.env.IMPORT_SECRET;
  const cronSecret = process.env.CRON_SECRET;

  const internalSecret = request.headers.get("x-internal-import-secret");
  const authorization = request.headers.get("authorization");

  if (importSecret && internalSecret === importSecret) return true;

  if (
    cronSecret &&
    authorization?.toLowerCase().startsWith("bearer ") &&
    authorization.replace(/^Bearer\s+/i, "") === cronSecret
  ) {
    return true;
  }

  return false;
}

function getGoogleKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanText(value: any) {
  return String(value || "").trim();
}

function normalizeText(value: any) {
  return String(value || "").toLowerCase();
}

function uniqueArray(items: string[]) {
  return Array.from(
    new Set(
      items
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function cleanAddress(address: string | null | undefined) {
  return cleanText(address)
    .replace(/,\s*USA$/i, "")
    .replace(/,\s*United States$/i, "");
}

function parseAddressParts(address: string) {
  const cleaned = cleanAddress(address);
  const parts = cleaned.split(",").map((part) => part.trim());

  const city = parts.length >= 2 ? parts[parts.length - 2] : "";
  const stateZip = parts.length >= 1 ? parts[parts.length - 1] : "";
  const match = stateZip.match(/\b([A-Z]{2})\s+(\d{5})/);

  return {
    address: cleaned,
    city: city || "",
    state: match?.[1] || "",
    zip_code: match?.[2] || "",
  };
}

function getReviewCount(place: any) {
  return Number(place.user_ratings_total || place.review_count || 0);
}

function getPhotoUrl(photoReference?: string | null) {
  const key = getGoogleKey();
  if (!key || !photoReference) return null;

  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoReference}&key=${key}`;
}

function inferPrimaryTag(textInput: string) {
  const text = normalizeText(textInput);

  if (text.includes("hookah") || text.includes("shisha")) return "hookah";
  if (text.includes("cigar")) return "cigar";
  if (text.includes("rooftop")) return "rooftop";
  if (text.includes("speakeasy")) return "speakeasy";
  if (text.includes("karaoke")) return "karaoke";
  if (text.includes("bowling")) return "bowling";
  if (text.includes("arcade")) return "arcade";
  if (text.includes("escape")) return "escape_room";
  if (text.includes("axe")) return "axe_throwing";
  if (text.includes("paintball")) return "paintball";
  if (text.includes("laser tag")) return "laser_tag";
  if (text.includes("mini golf")) return "mini_golf";
  if (text.includes("paint and sip")) return "paint_and_sip";
  if (text.includes("pottery")) return "pottery";
  if (text.includes("candle")) return "candle_making";
  if (text.includes("perfume")) return "perfume_making";
  if (text.includes("cooking")) return "cooking_class";
  if (text.includes("spa") || text.includes("massage")) return "spa";
  if (text.includes("comedy")) return "comedy";
  if (text.includes("jazz")) return "jazz";
  if (text.includes("live music")) return "live_music";
  if (text.includes("museum")) return "museum";
  if (text.includes("gallery")) return "art_gallery";
  if (text.includes("immersive")) return "immersive";
  if (text.includes("cinema") || text.includes("movie")) return "movie";
  if (text.includes("cruise")) return "cruise";
  if (text.includes("kayak")) return "kayaking";
  if (text.includes("bike")) return "bike_rental";
  if (text.includes("skating")) return "skating";
  if (text.includes("lounge")) return "lounge";

  return "specialty";
}

function inferActivityType(textInput: string) {
  const text = normalizeText(textInput);

  if (
    text.includes("hookah") ||
    text.includes("shisha") ||
    text.includes("cigar") ||
    text.includes("lounge") ||
    text.includes("speakeasy") ||
    text.includes("cocktail")
  ) {
    return "nightlife";
  }

  if (
    text.includes("bowling") ||
    text.includes("arcade") ||
    text.includes("escape") ||
    text.includes("axe") ||
    text.includes("paintball") ||
    text.includes("laser tag") ||
    text.includes("mini golf") ||
    text.includes("pool") ||
    text.includes("billiards")
  ) {
    return "games";
  }

  if (
    text.includes("paint and sip") ||
    text.includes("pottery") ||
    text.includes("candle") ||
    text.includes("perfume") ||
    text.includes("cooking") ||
    text.includes("dance") ||
    text.includes("art class")
  ) {
    return "creative";
  }

  if (
    text.includes("spa") ||
    text.includes("massage") ||
    text.includes("wellness") ||
    text.includes("sauna")
  ) {
    return "wellness";
  }

  if (
    text.includes("museum") ||
    text.includes("gallery") ||
    text.includes("jazz") ||
    text.includes("live music") ||
    text.includes("theater") ||
    text.includes("poetry") ||
    text.includes("immersive")
  ) {
    return "cultural";
  }

  if (
    text.includes("kayak") ||
    text.includes("bike") ||
    text.includes("skating") ||
    text.includes("garden") ||
    text.includes("outdoor") ||
    text.includes("market")
  ) {
    return "outdoor";
  }

  if (
    text.includes("wine") ||
    text.includes("cruise") ||
    text.includes("candlelight") ||
    text.includes("rooftop cinema")
  ) {
    return "romantic";
  }

  return "specialty";
}

function buildSearchKeywords(place: any, query: string) {
  const text = normalizeText(`${place.name} ${query} ${(place.types || []).join(" ")}`);
  const keywords = ["roseout", "activity", "specialty activity", "date idea", "outing"];

  if (text.includes("hookah") || text.includes("shisha")) {
    keywords.push("hookah", "hookah lounge", "shisha", "nightlife", "late night", "lounge", "birthday", "date night");
  }

  if (text.includes("cigar")) keywords.push("cigar", "cigar lounge", "nightlife");
  if (text.includes("rooftop")) keywords.push("rooftop", "views", "skyline", "luxury");
  if (text.includes("karaoke")) keywords.push("karaoke", "singing", "group outing");
  if (text.includes("bowling")) keywords.push("bowling", "games", "fun");
  if (text.includes("arcade")) keywords.push("arcade", "games", "interactive");
  if (text.includes("escape")) keywords.push("escape room", "interactive", "group outing");
  if (text.includes("axe")) keywords.push("axe throwing", "competitive");
  if (text.includes("paintball")) keywords.push("paintball", "competitive");
  if (text.includes("paint and sip")) keywords.push("paint and sip", "creative", "girls night");
  if (text.includes("pottery")) keywords.push("pottery", "creative");
  if (text.includes("spa") || text.includes("massage")) keywords.push("spa", "wellness", "couples");
  if (text.includes("jazz")) keywords.push("jazz", "live music", "romantic");
  if (text.includes("museum")) keywords.push("museum", "culture");
  if (text.includes("gallery")) keywords.push("art gallery", "culture");
  if (text.includes("immersive")) keywords.push("immersive", "unique");
  if (text.includes("cruise")) keywords.push("cruise", "romantic", "luxury");

  return uniqueArray(keywords);
}

function buildDateStyleTags(place: any, query: string) {
  const text = normalizeText(`${place.name} ${query}`);
  const tags: string[] = ["date-night", "outing"];

  if (text.includes("hookah") || text.includes("shisha")) {
    tags.push("nightlife", "late-night", "social", "group-friendly", "birthday");
  }

  if (text.includes("lounge") || text.includes("speakeasy")) {
    tags.push("nightlife", "upscale", "social");
  }

  if (text.includes("rooftop")) tags.push("romantic", "scenic", "upscale");
  if (text.includes("bowling") || text.includes("arcade") || text.includes("escape")) {
    tags.push("fun", "interactive", "group-friendly");
  }

  if (text.includes("paint and sip") || text.includes("pottery")) {
    tags.push("creative", "girls-night", "interactive");
  }

  if (text.includes("spa") || text.includes("massage")) {
    tags.push("romantic", "relaxing", "wellness", "couples");
  }

  if (text.includes("museum") || text.includes("gallery") || text.includes("jazz")) {
    tags.push("cultural", "romantic", "unique");
  }

  return uniqueArray(tags);
}

function getRoseOutScore(place: any) {
  const rating = Number(place.rating || 0);
  const reviews = getReviewCount(place);

  const ratingScore = rating ? rating * 18 : 45;
  const reviewScore = reviews ? Math.min(30, Math.log10(reviews + 1) * 12) : 0;
  const photoScore = place.photos?.length ? 10 : 0;
  const openScore = place.business_status === "OPERATIONAL" ? 10 : 0;

  return Math.min(100, Math.round(ratingScore + reviewScore + photoScore + openScore));
}

function shouldSkipPlace(place: any) {
  const rating = Number(place.rating || 0);
  const reviews = getReviewCount(place);

  if (!place.place_id || !place.name) return true;
  if (place.business_status && place.business_status !== "OPERATIONAL") return true;
  if (rating && rating < 3.8) return true;
  if (reviews && reviews < 10) return true;

  return false;
}

async function googleTextSearch(query: string) {
  const key = getGoogleKey();

  if (!key) {
    throw new Error("Missing GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", key);

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || `Google Places error: ${data.status}`);
  }

  return data.results || [];
}

async function googleDetails(placeId: string) {
  const key = getGoogleKey();

  if (!key) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");

  url.searchParams.set("place_id", placeId);
  url.searchParams.set(
    "fields",
    [
      "place_id",
      "name",
      "formatted_address",
      "formatted_phone_number",
      "international_phone_number",
      "website",
      "url",
      "rating",
      "user_ratings_total",
      "business_status",
      "types",
      "photos",
      "geometry",
      "price_level",
    ].join(",")
  );
  url.searchParams.set("key", key);

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  const data = await response.json();

  if (data.status !== "OK") return null;

  return data.result;
}

async function upsertSpecialtyActivity(place: any, query: string) {
  const details = await googleDetails(place.place_id);

  const merged = {
    ...place,
    ...(details || {}),
  };

  if (shouldSkipPlace(merged)) {
    return { status: "skipped" as const };
  }

  const formattedAddress =
    merged.formatted_address || merged.vicinity || place.formatted_address || place.vicinity || "";

  const addressParts = parseAddressParts(formattedAddress);
  const photoReference = merged.photos?.[0]?.photo_reference || place.photos?.[0]?.photo_reference;
  const imageUrl = getPhotoUrl(photoReference);

  const text = `${merged.name} ${query} ${(merged.types || []).join(" ")}`;
  const primaryTag = inferPrimaryTag(text);
  const activityType = inferActivityType(text);
  const score = getRoseOutScore(merged);
  const qr = await createClaimQr("activity");

  const row = {
    activity_name: merged.name,
    address: addressParts.address,
    city: addressParts.city,
    state: addressParts.state,
    zip_code: addressParts.zip_code,
    google_place_id: merged.place_id,
    latitude: merged.geometry?.location?.lat || null,
    longitude: merged.geometry?.location?.lng || null,

    rating: Number(merged.rating || 0),
    review_count: getReviewCount(merged),
    roseout_score: score,
    quality_score: score,
    popularity_score: Math.min(
      100,
      Math.round(Math.log10(getReviewCount(merged) + 1) * 35)
    ),
    review_score: Number(merged.rating || 0) * 20,

    activity_type: activityType,
    primary_tag: primaryTag,
    search_keywords: buildSearchKeywords(merged, query),
    date_style_tags: buildDateStyleTags(merged, query),

    atmosphere:
      activityType === "nightlife"
        ? "Nightlife, social, late-night"
        : activityType === "wellness"
        ? "Relaxed, calm, wellness"
        : activityType === "games"
        ? "Fun, interactive, group-friendly"
        : "Specialty experience",

    phone:
      merged.formatted_phone_number ||
      merged.international_phone_number ||
      null,
    website: merged.website || null,
    google_maps_url: merged.url || null,
    image_url: imageUrl,

    status: "approved",
    claim_status: qr.claim_status,
    claim_token: qr.claim_token,
    claim_url: qr.claim_url,
    qr_code_data_url: qr.qr_code_data_url,
  };

  const { error } = await supabaseAdmin.from("activities").upsert(row, {
    onConflict: "google_place_id",
    ignoreDuplicates: false,
  });

  if (error) {
    console.error("SPECIALTY ACTIVITY UPSERT ERROR:", error);
    return { status: "failed" as const, error: error.message };
  }

  return { status: "imported" as const };
}

function getQueries(category: string | null, query: string | null) {
  if (query) return [query];

  if (!category || category === "all") {
    return Object.values(SPECIALTY_QUERIES).flat();
  }

  return SPECIALTY_QUERIES[category] || [];
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const customQuery = searchParams.get("query")?.trim() || null;
    const area = searchParams.get("area")?.trim() || "Queens";
    const limit = Math.min(Number(searchParams.get("limit") || 10), 25);

    const queries = getQueries(category, customQuery);

    if (!queries.length) {
      return NextResponse.json(
        {
          error:
            "Invalid category. Use hookah, nightlife, games, creative, wellness, culture, romantic, outdoor, all, or pass a custom query.",
        },
        { status: 400 }
      );
    }

    const stats = {
      checked: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    const seenPlaceIds = new Set<string>();

    for (const baseQuery of queries) {
      const finalQuery = customQuery ? customQuery : `${baseQuery} in ${area}`;

      try {
        const places = await googleTextSearch(finalQuery);

        for (const place of places.slice(0, limit)) {
          if (seenPlaceIds.has(place.place_id)) continue;

          seenPlaceIds.add(place.place_id);
          stats.checked += 1;

          const result = await upsertSpecialtyActivity(place, finalQuery);

          if (result.status === "imported") stats.imported += 1;
          if (result.status === "skipped") stats.skipped += 1;

          if (result.status === "failed") {
            stats.failed += 1;
            if (result.error) stats.errors.push(result.error);
          }

          await sleep(150);
        }
      } catch (error: any) {
        stats.failed += 1;
        stats.errors.push(`${finalQuery}: ${error.message}`);
      }

      await sleep(250);
    }

    await supabaseAdmin.from("import_logs").insert({
      job_name: "manual_specialty_activity_import",
      imported_count: stats.imported,
      meta: {
        category: category || "custom",
        query: customQuery,
        area,
        limit,
        checked: stats.checked,
        skipped: stats.skipped,
        failed: stats.failed,
        errors: stats.errors.slice(0, 20),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Manual specialty import complete. This route only runs when you call it directly.",
      settings: {
        category: category || "custom",
        query: customQuery,
        area,
        limit,
      },
      stats,
    });
  } catch (error: any) {
    console.error("MANUAL SPECIALTY IMPORT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Manual specialty import failed",
      },
      { status: 500 }
    );
  }
}