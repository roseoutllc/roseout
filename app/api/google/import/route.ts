import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClaimQr } from "@/lib/claimQr";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ImportType = "restaurant" | "activity";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function fetchGooglePlacesPaged(query: string, limit: number) {
  const apiKey = getGoogleKey();
  if (!apiKey) throw new Error("Missing Google API key");

  const allPlaces: any[] = [];
  let nextPageToken: string | null = null;

  while (allPlaces.length < limit) {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/textsearch/json"
    );

    url.searchParams.set("key", apiKey);

    if (nextPageToken) {
      url.searchParams.set("pagetoken", nextPageToken);
      await sleep(2200);
    } else {
      url.searchParams.set("query", query);
    }

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) throw new Error("Google request failed");

    if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(data.error_message || `Google Places error: ${data.status}`);
    }

    allPlaces.push(...(data.results || []));

    if (!data.next_page_token) break;

    nextPageToken = data.next_page_token;
  }

  return allPlaces.slice(0, limit);
}

async function importRestaurant(place: any) {
  const { data: existing } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("google_place_id", place.place_id)
    .maybeSingle();

  if (existing) return { imported: false, skipped: true };

  const claimQr = await createClaimQr("restaurant");

  const { error } = await supabaseAdmin.from("restaurants").insert({
    restaurant_name: place.name,
    address: place.formatted_address || null,
    city: null,
    state: null,
    zip_code: null,
    cuisine: place.types?.join(", ") || null,
    rating: place.rating || 0,
    google_place_id: place.place_id,
    image_url: null,
    status: "approved",
    claimed: false,
    view_count: 0,
    click_count: 0,
    claim_count: 0,
    ...claimQr,
  });

  if (error) throw new Error(error.message);

  return { imported: true, skipped: false };
}

async function importActivity(place: any) {
  const { data: existing } = await supabaseAdmin
    .from("activities")
    .select("id")
    .eq("google_place_id", place.place_id)
    .maybeSingle();

  if (existing) return { imported: false, skipped: true };

  const claimQr = await createClaimQr("activity");

  const { error } = await supabaseAdmin.from("activities").insert({
    activity_name: place.name,
    activity_type: place.types?.[0] || "activity",
    address: place.formatted_address || null,
    city: null,
    state: null,
    zip_code: null,
    rating: place.rating || 0,
    google_place_id: place.place_id,
    image_url: null,
    status: "approved",
    claimed: false,
    view_count: 0,
    click_count: 0,
    claim_count: 0,
    ...claimQr,
  });

  if (error) throw new Error(error.message);

  return { imported: true, skipped: false };
}

async function runImport({
  queries,
  type,
  limit,
}: {
  queries: string[];
  type: ImportType;
  limit: number;
}) {
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  let found = 0;

  const seenPlaceIds = new Set<string>();

  for (const query of queries) {
    if (imported >= limit) break;

    const remaining = limit - imported;
    const places = await fetchGooglePlacesPaged(query, remaining);

    found += places.length;

    for (const place of places) {
      if (imported >= limit) break;
      if (!place.place_id || seenPlaceIds.has(place.place_id)) continue;

      seenPlaceIds.add(place.place_id);

      try {
        const result =
          type === "activity"
            ? await importActivity(place)
            : await importRestaurant(place);

        if (result.imported) imported++;
        if (result.skipped) skipped++;
      } catch (error) {
        failed++;
        console.error("Import item failed:", error);
      }
    }
  }

  return {
    success: true,
    type,
    requested_limit: limit,
    total_found_from_google: found,
    imported,
    skipped,
    failed,
    queries_used: queries,
  };
}

function defaultQueries(type: ImportType) {
  if (type === "activity") {
    return [
      "fun activities in Queens NY",
      "things to do in Queens NY",
      "museums in Queens NY",
      "bowling in Queens NY",
      "arcades in Queens NY",
      "parks in Queens NY",
      "date night activities in Queens NY",
      "entertainment venues in Queens NY",
    ];
  }

  return [
    "restaurants in Queens NY",
    "romantic restaurants in Queens NY",
    "seafood restaurants in Queens NY",
    "steak restaurants in Queens NY",
    "Italian restaurants in Queens NY",
    "Caribbean restaurants in Queens NY",
    "rooftop restaurants in Queens NY",
    "date night restaurants in Queens NY",
  ];
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;

    const type: ImportType =
      params.get("type") === "activity" ? "activity" : "restaurant";

    const limit = Math.min(Number(params.get("limit") || 50), 500);

    const queryParams = params.getAll("query");
    const queries = queryParams.length ? queryParams : defaultQueries(type);

    const result = await runImport({ queries, type, limit });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const type: ImportType =
      body.type === "activity" ? "activity" : "restaurant";

    const limit = Math.min(Number(body.limit || 50), 500);

    const queries =
      Array.isArray(body.queries) && body.queries.length
        ? body.queries
        : body.query
          ? [body.query]
          : defaultQueries(type);

    const result = await runImport({ queries, type, limit });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}