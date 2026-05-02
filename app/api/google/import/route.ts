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

function categorizeActivity(name: string, types: string[] = []) {
  const text = `${name} ${types.join(" ")}`.toLowerCase();

  // Birthday intents
  if (text.includes("birthday dinner")) return "birthday_dinner";
  if (text.includes("birthday brunch")) return "birthday_brunch";
  if (text.includes("birthday")) return "birthday";

  // Food / daytime
  if (text.includes("brunch")) return "brunch";
  if (text.includes("breakfast")) return "breakfast";
  if (text.includes("cafe") || text.includes("coffee")) return "cafe";

  // Fun / competitive
  if (text.includes("axe") || text.includes("throwing")) return "axe_throwing";
  if (text.includes("paintball")) return "paintball";
  if (text.includes("arcade")) return "arcade";
  if (text.includes("bowling")) return "bowling";

  if (
    text.includes("mini golf") ||
    text.includes("miniature golf") ||
    text.includes("minigolf")
  ) {
    return "mini_golf";
  }

  if (
    text.includes("golf") ||
    text.includes("topgolf") ||
    text.includes("driving range") ||
    text.includes("indoor golf")
  ) {
    return "golf";
  }

  // Nightlife
  if (
    text.includes("nightclub") ||
    text.includes("night club") ||
    text.includes("dance club")
  ) {
    return "nightclub";
  }

  if (text.includes("hookah")) return "hookah";
  if (text.includes("cigar")) return "cigar";
  if (text.includes("rooftop")) return "rooftop";
  if (text.includes("lounge")) return "lounge";
  if (text.includes("bar")) return "bar";
  if (text.includes("club")) return "nightclub";

  // Entertainment
  if (text.includes("comedy")) return "comedy";
  if (text.includes("karaoke")) return "karaoke";
  if (text.includes("escape")) return "escape_room";

  // Creative
  if (text.includes("paint") && text.includes("sip")) return "paint_and_sip";

  // Music
  if (text.includes("jazz") || text.includes("live music")) return "live_music";

  // Culture
  if (text.includes("museum")) return "museum";
  if (text.includes("gallery") || text.includes("art")) return "art_gallery";
  if (text.includes("theater") || text.includes("theatre")) return "theater";

  // Outdoor / scenic
  if (text.includes("park")) return "park";
  if (text.includes("waterfront") || text.includes("scenic")) return "scenic";

  // Date intents / vibes
  if (
    text.includes("romantic") ||
    text.includes("date night") ||
    text.includes("candle") ||
    text.includes("couple")
  ) {
    return "romantic";
  }

  if (
    text.includes("luxury") ||
    text.includes("upscale") ||
    text.includes("fine dining") ||
    text.includes("elegant")
  ) {
    return "luxury";
  }

  if (
    text.includes("fun") ||
    text.includes("games") ||
    text.includes("interactive") ||
    text.includes("competitive")
  ) {
    return "fun";
  }

  if (
    text.includes("chill") ||
    text.includes("relax") ||
    text.includes("casual") ||
    text.includes("low key") ||
    text.includes("low-key")
  ) {
    return "chill";
  }

  if (
    text.includes("unique") ||
    text.includes("hidden gem") ||
    text.includes("creative")
  ) {
    return "unique";
  }

  return types[0] || "activity";
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
      throw new Error(
        data.error_message || `Google Places error: ${data.status}`
      );
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
    activity_type: categorizeActivity(place.name, place.types || []),
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
      "romantic date ideas NYC",
      "fun date ideas NYC",
      "luxury date night NYC",
      "chill date spots NYC",
      "unique date ideas NYC",
      "casual date ideas NYC",
      "active date ideas NYC",
      "competitive date ideas NYC",
      "creative date ideas NYC",
      "outdoor date ideas NYC",
      "indoor date ideas NYC",
      "first date ideas NYC",
      "anniversary date ideas NYC",
      "birthday date ideas NYC",
      "birthday activities NYC",
      "birthday brunch NYC",
      "birthday dinner NYC",
      "birthday lounges NYC",
      "birthday rooftop NYC",
      "double date ideas NYC",

      "things to do in New York City",
      "date night activities NYC",
      "romantic things to do NYC",
      "fun date night NYC",
      "couples activities NYC",
      "fun activities NYC",

      "activities in Manhattan NY",
      "activities in Brooklyn NY",
      "activities in Queens NY",
      "activities in Bronx NY",
      "activities in Staten Island NY",

      "brunch spots NYC",
      "breakfast cafes NYC",
      "coffee shops NYC",
      "cafes NYC",

      "mini golf NYC",
      "miniature golf NYC",
      "indoor golf NYC",
      "golf courses NYC",
      "driving range NYC",
      "topgolf NYC",

      "axe throwing NYC",
      "axe throwing Manhattan NY",
      "axe throwing Brooklyn NY",
      "axe throwing Queens NY",
      "paintball NYC",
      "paintball near NYC",

      "nightclubs NYC",
      "night clubs NYC",
      "dance clubs NYC",
      "nightclubs Manhattan NY",
      "nightclubs Brooklyn NY",
      "nightclubs Queens NY",

      "hookah lounges NYC",
      "cigar lounges NYC",
      "lounges NYC",
      "rooftop lounges NYC",
      "cocktail lounges NYC",
      "bars NYC",
      "rooftop bars NYC",
      "wine bars NYC",
      "sports bars NYC",

      "comedy clubs NYC",
      "jazz clubs NYC",
      "live music venues NYC",
      "karaoke NYC",
      "bowling NYC",
      "arcades NYC",
      "escape rooms NYC",
      "paint and sip NYC",

      "museums NYC",
      "art galleries NYC",
      "theaters NYC",
      "parks NYC",
      "waterfront spots NYC",
      "scenic spots NYC",
    ];
  }

  return [
    "birthday dinner NYC",
    "birthday dinner restaurants NYC",
    "birthday brunch NYC",
    "birthday brunch restaurants NYC",
    "birthday restaurants NYC",
    "birthday rooftop restaurants NYC",
    "birthday fine dining NYC",

    "romantic restaurants NYC",
    "luxury restaurants NYC",
    "upscale restaurants NYC",
    "fun restaurants NYC",
    "casual date restaurants NYC",
    "first date restaurants NYC",
    "anniversary restaurants NYC",
    "birthday dinner restaurants NYC",

    "restaurants in New York City",
    "date night restaurants NYC",

    "restaurants in Manhattan NY",
    "restaurants in Brooklyn NY",
    "restaurants in Queens NY",
    "restaurants in Bronx NY",
    "restaurants in Staten Island NY",

    "brunch NYC",
    "brunch restaurants NYC",
    "best brunch NYC",
    "breakfast restaurants NYC",
    "breakfast spots NYC",
    "coffee shops NYC",
    "cafes NYC",

    "romantic restaurants Manhattan NY",
    "romantic restaurants Brooklyn NY",
    "romantic restaurants Queens NY",

    "rooftop restaurants NYC",
    "rooftop dining NYC",
    "restaurants with a view NYC",
    "lounge restaurants NYC",
    "late night restaurants NYC",

    "steak restaurants NYC",
    "seafood restaurants NYC",
    "Italian restaurants NYC",
    "Caribbean restaurants NYC",
    "Mexican restaurants NYC",
    "Asian restaurants NYC",
    "fine dining NYC",
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