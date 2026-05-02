import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type BackfillTable = "restaurants" | "activities";

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
function getPrimaryTagFromText(name: string, address: string | null) {
  const text = `${name || ""} ${address || ""}`.toLowerCase();

  if (text.includes("steak")) return "steak";
  if (text.includes("seafood")) return "seafood";
  if (text.includes("sushi")) return "sushi";
  if (text.includes("italian")) return "italian";
  if (text.includes("mexican")) return "mexican";
  if (text.includes("caribbean")) return "caribbean";

  if (text.includes("brunch")) return "brunch";
  if (text.includes("cafe") || text.includes("coffee")) return "cafe";

  if (text.includes("rooftop")) return "rooftop";
  if (text.includes("lounge")) return "lounge";
  if (text.includes("bar")) return "bar";

  if (text.includes("comedy")) return "comedy";
  if (text.includes("bowling")) return "bowling";
  if (text.includes("karaoke")) return "karaoke";

  if (text.includes("hookah") || text.includes("shisha"))
    return "hookah";
  if (text.includes("cigar")) return "cigar";

  return null;
}
async function getGooglePlaceDetails(placeId: string) {
  const apiKey = getGoogleKey();

  if (!apiKey) throw new Error("Missing Google API key");

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");

  url.searchParams.set("key", apiKey);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "user_ratings_total,rating,website");

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();

  if (!res.ok || data.status !== "OK") {
    return {
      review_count: null,
      rating: null,
      website: null,
    };
  }

  return {
    review_count: data.result?.user_ratings_total ?? null,
    rating: data.result?.rating ?? null,
    website: data.result?.website ?? null,
  };
}

async function backfillTable(table: BackfillTable, limit: number) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select("id, google_place_id, review_count, rating, website")
    .not("google_place_id", "is", null)
    .or("review_count.is.null,review_count.eq.0,website.is.null,website.eq.")
    .limit(limit);

  if (error) throw new Error(error.message);

  let checked = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of data || []) {
    checked++;

    try {
      const details = await getGooglePlaceDetails(item.google_place_id);

      if (
        details.review_count === null &&
        details.rating === null &&
        !details.website
      ) {
        skipped++;
        continue;
      }

      const updatePayload: Record<string, any> = {};

      if (details.review_count !== null) {
        updatePayload.review_count = details.review_count;
      }

      if (details.rating !== null) {
        updatePayload.rating = details.rating;
      }

      if (details.website) {
        updatePayload.website = details.website;
      }

      if (Object.keys(updatePayload).length === 0) {
        skipped++;
        continue;
      }

      const { error: updateError } = await supabaseAdmin
        .from(table)
        .update(updatePayload)
        .eq("id", item.id);

      if (updateError) {
        failed++;
      } else {
        updated++;
      }
    } catch (error) {
      console.error(`Backfill failed for ${table}:`, error);
      failed++;
    }
  }

  return {
    table,
    checked,
    updated,
    skipped,
    failed,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const limit = Math.min(Number(body.limit || 25), 100);

    const restaurants = await backfillTable("restaurants", limit);
    const activities = await backfillTable("activities", limit);

    return NextResponse.json({
      success: true,
      limit,
      restaurants,
      activities,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Backfill failed" },
      { status: 500 }
    );
  }
}