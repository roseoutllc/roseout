import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

type BackfillTable = "restaurants" | "activities";

type GooglePlaceDetails = {
  phone: string | null;
  website: string | null;
  google_maps_url: string | null;
  review_count: number | null;
  rating: number | null;
  price_level: number | null;
};

function getGoogleKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  );
}

function getBearerToken(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim();
}

function isAuthorized(request: NextRequest) {
  if (process.env.NODE_ENV === "development") return true;

  const importSecret = request.headers.get("x-internal-import-secret");
  const bearerToken = getBearerToken(request);

  if (process.env.IMPORT_SECRET && importSecret === process.env.IMPORT_SECRET) {
    return true;
  }

  if (process.env.CRON_SECRET && bearerToken === process.env.CRON_SECRET) {
    return true;
  }

  return false;
}

async function logImportRun(result: any, errorMessage?: string) {
  try {
    await supabaseAdmin.from("import_logs").insert({
      job_name: "google_details_backfill",
      run_date: new Date().toISOString().split("T")[0],
      meta: result || {},
      error: errorMessage || null,
    });
  } catch (err) {
    console.error("Backfill logging failed:", err);
  }
}

function shouldSkipLowQualityExisting(
  item: any,
  minRating: number,
  minReviews: number
) {
  const rating = Number(item.rating || 0);
  const reviewCount = Number(item.review_count || 0);

  if (!rating || !reviewCount) return false;

  return rating < minRating || reviewCount < minReviews;
}

async function getGooglePlaceDetails(
  placeId: string
): Promise<GooglePlaceDetails | null> {
  const apiKey = getGoogleKey();

  if (!apiKey) throw new Error("Missing Google API key");

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");

  url.searchParams.set("key", apiKey);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set(
    "fields",
    [
      "formatted_phone_number",
      "international_phone_number",
      "website",
      "url",
      "user_ratings_total",
      "rating",
      "price_level",
    ].join(",")
  );

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();

  if (!res.ok || data.status !== "OK") {
    console.error("Google Details failed:", {
      placeId,
      status: data.status,
      error_message: data.error_message,
    });

    return null;
  }

  const result = data.result || {};

  return {
    phone:
      result.formatted_phone_number ||
      result.international_phone_number ||
      null,
    website: result.website || null,
    google_maps_url: result.url || null,
    review_count: result.user_ratings_total ?? null,
    rating: result.rating ?? null,
    price_level: result.price_level ?? null,
  };
}

async function backfillTable(
  table: BackfillTable,
  limit: number,
  minRating: number,
  minReviews: number
) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select(
      "id, google_place_id, phone, website, google_maps_url, review_count, rating"
    )
    .not("google_place_id", "is", null)
    .or(
      "phone.is.null,phone.eq.,website.is.null,website.eq.,google_maps_url.is.null,google_maps_url.eq.,review_count.is.null,review_count.eq.0,rating.is.null,rating.eq.0"
    )
    .limit(limit);

  if (error) throw new Error(error.message);

  let checked = 0;
  let enriched = 0;
  let skippedLowQuality = 0;
  let skippedNoDetails = 0;
  let failed = 0;

  for (const item of data || []) {
    checked++;

    try {
      if (shouldSkipLowQualityExisting(item, minRating, minReviews)) {
        skippedLowQuality++;
        continue;
      }

      const details = await getGooglePlaceDetails(item.google_place_id);

      if (!details) {
        skippedNoDetails++;
        continue;
      }

      const finalRating = Number(details.rating || item.rating || 0);
      const finalReviewCount = Number(
        details.review_count || item.review_count || 0
      );

      if (finalRating < minRating || finalReviewCount < minReviews) {
        skippedLowQuality++;
        continue;
      }

      const updatePayload: Record<string, any> = {};

      if (details.phone) updatePayload.phone = details.phone;
      if (details.website) updatePayload.website = details.website;
      if (details.google_maps_url) {
        updatePayload.google_maps_url = details.google_maps_url;
      }
      if (details.review_count !== null) {
        updatePayload.review_count = details.review_count;
      }
      if (details.rating !== null) {
        updatePayload.rating = details.rating;
      }
      if (details.price_level !== null) {
        updatePayload.price_level = details.price_level;
      }

      if (Object.keys(updatePayload).length === 0) {
        skippedNoDetails++;
        continue;
      }

      const { error: updateError } = await supabaseAdmin
        .from(table)
        .update(updatePayload)
        .eq("id", item.id);

      if (updateError) {
        console.error(`${table} enrichment update failed:`, updateError);
        failed++;
      } else {
        enriched++;
      }
    } catch (error) {
      console.error(`Backfill failed for ${table}:`, error);
      failed++;
    }
  }

  return {
    table,
    checked,
    enriched,
    skippedLowQuality,
    skippedNoDetails,
    failed,
  };
}

async function runBackfill(request: NextRequest) {
  let responsePayload: any = null;

  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any = {};

    if (request.method !== "GET") {
      body = await request.json().catch(() => ({}));
    }

    const searchParams = request.nextUrl.searchParams;

    const limit = Math.min(
      Number(body.limit || searchParams.get("limit") || 25),
      100
    );

    const minRating = Number(
      body.minRating || searchParams.get("minRating") || 4.2
    );

    const minReviews = Number(
      body.minReviews || searchParams.get("minReviews") || 75
    );

    const restaurants = await backfillTable(
      "restaurants",
      limit,
      minRating,
      minReviews
    );

    const activities = await backfillTable(
      "activities",
      limit,
      minRating,
      minReviews
    );

    responsePayload = {
      success: true,
      message:
        "Smart Google Details backfill complete. Phone numbers, websites, Google Maps URLs, ratings, review counts, and price levels were only imported for higher-quality listings.",
      settings: {
        limit,
        minRating,
        minReviews,
      },
      restaurants,
      activities,
    };

    await logImportRun(responsePayload);

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    responsePayload = {
      error: error.message || "Backfill failed",
    };

    await logImportRun(responsePayload, responsePayload.error);

    return NextResponse.json(responsePayload, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return runBackfill(request);
}

export async function POST(request: NextRequest) {
  return runBackfill(request);
}