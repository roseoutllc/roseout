import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClaimQr } from "@/lib/claimQr";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ImportType = "restaurant" | "activity";
type ImportMode = "text" | "nearby";
type ImportBatch =
  | "core"
  | "date"
  | "birthday"
  | "brunch"
  | "luxury"
  | "nightlife"
  | "cuisine"
  | "casual"
  | "activity"
  | "fun"
  | "culture"
  | "outdoor"
  | "all";

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

function placeText(place: any) {
  return `${place.name || ""} ${place.formatted_address || ""} ${
    place.vicinity || ""
  } ${place.types?.join(" ") || ""}`.toLowerCase();
}

function googlePhotoUrl(place: any) {
  const apiKey = getGoogleKey();
  const ref = place.photos?.[0]?.photo_reference;

  if (!apiKey || !ref) return null;

  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${apiKey}`;
}

function isHookah(place: any) {
  const text = placeText(place);
  return text.includes("hookah") || text.includes("shisha");
}

function isCigar(place: any) {
  const text = placeText(place);
  return text.includes("cigar");
}

function isHighQuality(place: any) {
  const rating = Number(place.rating || 0);
  const reviews = Number(place.user_ratings_total || 0);

  if (!place.name) return false;
  if (!place.formatted_address && !place.vicinity) return false;
  if (rating < 4.0) return false;
  if (reviews < 50) return false;

  return true;
}

function categorizeActivity(name: string, types: string[] = []) {
  const text = `${name} ${types.join(" ")}`.toLowerCase();

  if (text.includes("birthday dinner")) return "birthday_dinner";
  if (text.includes("birthday brunch")) return "birthday_brunch";
  if (text.includes("birthday")) return "birthday";

  if (text.includes("brunch")) return "brunch";
  if (text.includes("breakfast")) return "breakfast";
  if (text.includes("cafe") || text.includes("coffee")) return "cafe";

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

  if (
    text.includes("nightclub") ||
    text.includes("night club") ||
    text.includes("dance club")
  ) {
    return "nightclub";
  }

  if (text.includes("hookah") || text.includes("shisha")) return "hookah";
  if (text.includes("cigar")) return "cigar";
  if (text.includes("rooftop")) return "rooftop";
  if (text.includes("lounge")) return "lounge";
  if (text.includes("bar")) return "bar";
  if (text.includes("club")) return "nightclub";

  if (text.includes("comedy")) return "comedy";
  if (text.includes("stand up")) return "comedy";
  if (text.includes("karaoke")) return "karaoke";
  if (text.includes("escape")) return "escape_room";

  if (text.includes("paint") && text.includes("sip")) return "paint_and_sip";

  if (text.includes("jazz") || text.includes("live music")) return "live_music";

  if (text.includes("museum")) return "museum";
  if (text.includes("gallery") || text.includes("art")) return "art_gallery";
  if (text.includes("theater") || text.includes("theatre")) return "theater";

  if (text.includes("park")) return "park";
  if (text.includes("waterfront") || text.includes("scenic")) return "scenic";

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
  let tokenRetryCount = 0;

  while (allPlaces.length < limit) {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/textsearch/json"
    );

    url.searchParams.set("key", apiKey);

    if (nextPageToken) {
      url.searchParams.set("pagetoken", nextPageToken);
      await sleep(3000);
    } else {
      url.searchParams.set("query", query);
    }

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      console.warn("Google text request failed:", query);
      break;
    }

    if (data.status === "INVALID_REQUEST") {
      if (nextPageToken && tokenRetryCount < 5) {
        tokenRetryCount++;
        await sleep(3000);
        continue;
      }

      console.warn("Skipping Google text query because of INVALID_REQUEST:", {
        query,
        nextPageToken: Boolean(nextPageToken),
      });

      break;
    }

    if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.warn("Skipping Google text query because of Places error:", {
        status: data.status,
        error_message: data.error_message,
        query,
      });

      break;
    }

    tokenRetryCount = 0;
    allPlaces.push(...(data.results || []));

    if (!data.next_page_token) break;
    nextPageToken = data.next_page_token;
  }

  return allPlaces.slice(0, limit);
}

async function fetchGoogleNearbySearch({
  keyword,
  lat,
  lng,
  radius,
  limit,
}: {
  keyword: string;
  lat: number;
  lng: number;
  radius: number;
  limit: number;
}) {
  const apiKey = getGoogleKey();
  if (!apiKey) throw new Error("Missing Google API key");

  const allPlaces: any[] = [];
  let nextPageToken: string | null = null;
  let tokenRetryCount = 0;

  while (allPlaces.length < limit) {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    );

    url.searchParams.set("key", apiKey);

    if (nextPageToken) {
      url.searchParams.set("pagetoken", nextPageToken);
      await sleep(3000);
    } else {
      url.searchParams.set("location", `${lat},${lng}`);
      url.searchParams.set("radius", String(radius));
      url.searchParams.set("keyword", keyword);
    }

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      console.warn("Google nearby request failed:", keyword);
      break;
    }

    if (data.status === "INVALID_REQUEST") {
      if (nextPageToken && tokenRetryCount < 5) {
        tokenRetryCount++;
        await sleep(3000);
        continue;
      }

      console.warn("Skipping Google nearby query because of INVALID_REQUEST:", {
        keyword,
        lat,
        lng,
        radius,
        nextPageToken: Boolean(nextPageToken),
      });

      break;
    }

    if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.warn("Skipping Google nearby query because of Places error:", {
        status: data.status,
        error_message: data.error_message,
        keyword,
        lat,
        lng,
        radius,
      });

      break;
    }

    tokenRetryCount = 0;
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

  const hookah = isHookah(place);
  const cigar = isCigar(place);

  const { error } = await supabaseAdmin.from("restaurants").insert({
    restaurant_name: place.name,
    address: place.formatted_address || place.vicinity || null,
    city: null,
    state: null,
    zip_code: null,
    cuisine: place.types?.join(", ") || null,
    rating: place.rating || 0,
    review_count: place.user_ratings_total || 0,
    google_place_id: place.place_id,
    image_url: googlePhotoUrl(place),
    latitude: place.geometry?.location?.lat || null,
    longitude: place.geometry?.location?.lng || null,
    status: "approved",
    claimed: false,
    view_count: 0,
    click_count: 0,
    claim_count: 0,
    primary_tag: hookah ? "hookah" : cigar ? "cigar" : null,
    search_keywords: [
      ...(hookah
        ? ["hookah", "shisha", "hookah restaurant", "hookah lounge"]
        : []),
      ...(cigar ? ["cigar", "cigar lounge", "cigar bar"] : []),
    ],
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

  const hookah = isHookah(place);
  const cigar = isCigar(place);

  const { error } = await supabaseAdmin.from("activities").insert({
    activity_name: place.name,
    activity_type: categorizeActivity(place.name, place.types || []),
    address: place.formatted_address || place.vicinity || null,
    city: null,
    state: null,
    zip_code: null,
    rating: place.rating || 0,
    review_count: place.user_ratings_total || 0,
    google_place_id: place.place_id,
    image_url: googlePhotoUrl(place),
    latitude: place.geometry?.location?.lat || null,
    longitude: place.geometry?.location?.lng || null,
    status: "approved",
    claimed: false,
    view_count: 0,
    click_count: 0,
    claim_count: 0,
    primary_tag: hookah ? "hookah" : cigar ? "cigar" : null,
    search_keywords: [
      ...(hookah
        ? ["hookah", "shisha", "hookah lounge", "hookah restaurant"]
        : []),
      ...(cigar ? ["cigar", "cigar lounge", "cigar bar"] : []),
    ],
    ...claimQr,
  });

  if (error) throw new Error(error.message);

  return { imported: true, skipped: false };
}

const geoAreas = [
  { name: "Manhattan", lat: 40.7831, lng: -73.9712 },
  { name: "Brooklyn", lat: 40.6782, lng: -73.9442 },
  { name: "Queens", lat: 40.7282, lng: -73.7949 },
  { name: "Bronx", lat: 40.8448, lng: -73.8648 },
  { name: "Staten Island", lat: 40.5795, lng: -74.1502 },

  { name: "Astoria", lat: 40.7644, lng: -73.9235 },
  { name: "Long Island City", lat: 40.7447, lng: -73.9485 },
  { name: "Flushing", lat: 40.7675, lng: -73.8331 },
  { name: "Bayside", lat: 40.7586, lng: -73.7654 },
  { name: "Forest Hills", lat: 40.7181, lng: -73.8448 },
  { name: "Rego Park", lat: 40.7256, lng: -73.8625 },
  { name: "Jamaica", lat: 40.7027, lng: -73.7890 },
  { name: "Queens Village", lat: 40.7157, lng: -73.7419 },
  { name: "Jackson Heights", lat: 40.7557, lng: -73.8831 },
  { name: "Elmhurst", lat: 40.7365, lng: -73.8772 },
  { name: "Howard Beach", lat: 40.6571, lng: -73.8436 },
  { name: "Rockaway", lat: 40.5795, lng: -73.8372 },

  { name: "Garden City", lat: 40.7268, lng: -73.6343 },
  { name: "Mineola", lat: 40.7493, lng: -73.6407 },
  { name: "Hempstead", lat: 40.7062, lng: -73.6187 },
  { name: "Freeport", lat: 40.6576, lng: -73.5832 },
  { name: "Rockville Centre", lat: 40.6587, lng: -73.6412 },
  { name: "Westbury", lat: 40.7557, lng: -73.5876 },
  { name: "Hicksville", lat: 40.7684, lng: -73.5251 },
  { name: "Great Neck", lat: 40.8007, lng: -73.7285 },
  { name: "Long Beach", lat: 40.5884, lng: -73.6579 },
  { name: "Manhasset", lat: 40.7979, lng: -73.6996 },
  { name: "Syosset", lat: 40.8262, lng: -73.5021 },
  { name: "Oyster Bay", lat: 40.8657, lng: -73.5321 },

  { name: "Huntington", lat: 40.8682, lng: -73.4257 },
  { name: "Babylon", lat: 40.6957, lng: -73.3257 },
  { name: "Patchogue", lat: 40.7657, lng: -73.0151 },
  { name: "Bay Shore", lat: 40.7251, lng: -73.2454 },
  { name: "Islip", lat: 40.7298, lng: -73.2104 },
  { name: "Ronkonkoma", lat: 40.8154, lng: -73.1123 },
  { name: "Smithtown", lat: 40.8559, lng: -73.2007 },
  { name: "Riverhead", lat: 40.9170, lng: -72.6620 },
  { name: "Port Jefferson", lat: 40.9465, lng: -73.0693 },
  { name: "Stony Brook", lat: 40.9257, lng: -73.1409 },
  { name: "Commack", lat: 40.8429, lng: -73.2929 },
  { name: "Melville", lat: 40.7934, lng: -73.4151 },

  { name: "Yonkers", lat: 40.9312, lng: -73.8988 },
  { name: "White Plains", lat: 41.033, lng: -73.7629 },
  { name: "New Rochelle", lat: 40.9115, lng: -73.7824 },
  { name: "Mount Vernon", lat: 40.9126, lng: -73.8371 },

  { name: "Hoboken", lat: 40.7433, lng: -74.0324 },
  { name: "Jersey City", lat: 40.7178, lng: -74.0431 },
  { name: "Edgewater", lat: 40.827, lng: -73.9757 },
  { name: "Fort Lee", lat: 40.8509, lng: -73.9701 },
  { name: "Newark", lat: 40.7357, lng: -74.1724 },
];

const restaurantCategoryBatches: Record<ImportBatch, string[]> = {
  core: [
    "restaurants",
    "best restaurants",
    "top rated restaurants",
    "new restaurants",
    "popular restaurants",
  ],
  date: [
    "date night restaurants",
    "romantic restaurants",
    "intimate restaurants",
    "cozy restaurants",
    "anniversary restaurants",
    "first date restaurants",
    "casual date restaurants",
  ],
  birthday: [
    "birthday dinner restaurants",
    "birthday brunch restaurants",
    "birthday celebration restaurants",
    "birthday restaurants",
    "birthday rooftop restaurants",
    "birthday fine dining",
    "restaurants for celebrations",
  ],
  brunch: [
    "breakfast restaurants",
    "brunch restaurants",
    "best brunch",
    "bottomless brunch",
    "birthday brunch restaurants",
    "lunch restaurants",
    "coffee shops",
    "cafes",
    "bakeries",
    "dessert spots",
    "ice cream shops",
  ],
  luxury: [
    "fine dining restaurants",
    "luxury restaurants",
    "upscale restaurants",
    "michelin star restaurants",
    "tasting menu restaurants",
    "rooftop restaurants",
    "restaurants with a view",
    "waterfront restaurants",
    "outdoor dining restaurants",
    "garden restaurants",
  ],
  nightlife: [
    "late night restaurants",
    "24 hour restaurants",
    "lounge restaurants",
    "restaurants with music",
    "restaurants with dj",
    "live music restaurants",
    "jazz restaurants",
    "restaurants with dancing",
    "cocktail bars",
    "wine bars",
    "sports bars",
    "rooftop bars",
    "bars with food",
    "hookah restaurants",
    "hookah lounges",
    "shisha lounges",
    "hookah bars",
    "cigar lounges",
    "cigar bars",
  ],
  cuisine: [
    "american restaurants",
    "southern restaurants",
    "soul food restaurants",
    "bbq restaurants",
    "steakhouses",
    "burger restaurants",
    "seafood restaurants",
    "italian restaurants",
    "french restaurants",
    "spanish restaurants",
    "greek restaurants",
    "mediterranean restaurants",
    "chinese restaurants",
    "japanese restaurants",
    "sushi restaurants",
    "ramen restaurants",
    "thai restaurants",
    "korean restaurants",
    "vietnamese restaurants",
    "asian fusion restaurants",
    "mexican restaurants",
    "latin restaurants",
    "peruvian restaurants",
    "dominican restaurants",
    "puerto rican restaurants",
    "caribbean restaurants",
    "jamaican restaurants",
    "african restaurants",
    "ethiopian restaurants",
    "nigerian restaurants",
    "middle eastern restaurants",
    "halal restaurants",
  ],
  casual: [
    "vegan restaurants",
    "vegetarian restaurants",
    "healthy restaurants",
    "gluten free restaurants",
    "instagrammable restaurants",
    "trendy restaurants",
    "hidden gem restaurants",
    "unique restaurants",
    "themed restaurants",
    "dinner restaurants",
    "fun restaurants",
  ],
  activity: [],
  fun: [],
  culture: [],
  outdoor: [],
  all: [],
};

const activityCategoryBatches: Record<ImportBatch, string[]> = {
  activity: [
    "things to do",
    "date night activities",
    "romantic things to do",
    "birthday activities",
    "birthday date ideas",
    "fun activities",
    "couples activities",
    "double date ideas",
  ],
  fun: [
    "bowling",
    "arcades",
    "karaoke",
    "escape rooms",
    "mini golf",
    "miniature golf",
    "golf",
    "indoor golf",
    "driving range",
    "axe throwing",
    "paintball",
    "paint and sip",
  ],
  nightlife: [
    "comedy clubs",
    "comedy club",
    "stand up comedy",
    "stand up comedy clubs",
    "comedy shows",
    "comedy night",
    "nightclubs",
    "night clubs",
    "dance clubs",
    "hookah lounges",
    "cigar lounges",
    "lounges",
    "rooftop bars",
    "cocktail lounges",
    "live music",
    "jazz clubs",
  ],
  culture: [
    "museums",
    "art galleries",
    "theaters",
    "movie theaters",
    "live shows",
    "comedy clubs",
    "stand up comedy",
    "comedy shows",
  ],
  outdoor: [
    "parks",
    "waterfront spots",
    "scenic spots",
    "gardens",
    "outdoor activities",
  ],
  core: [],
  date: [],
  birthday: [],
  brunch: [],
  luxury: [],
  cuisine: [],
  casual: [],
  all: [],
};

function normalizeBatch(value: any): ImportBatch {
  const batch = String(value || "core").toLowerCase();

  const allowed: ImportBatch[] = [
    "core",
    "date",
    "birthday",
    "brunch",
    "luxury",
    "nightlife",
    "cuisine",
    "casual",
    "activity",
    "fun",
    "culture",
    "outdoor",
    "all",
  ];

  return allowed.includes(batch as ImportBatch)
    ? (batch as ImportBatch)
    : "core";
}

function getCategories(type: ImportType, batch: ImportBatch) {
  const source =
    type === "restaurant" ? restaurantCategoryBatches : activityCategoryBatches;

  if (batch === "all") {
    return Array.from(
      new Set(
        Object.entries(source)
          .filter(([key]) => key !== "all")
          .flatMap(([, values]) => values)
      )
    );
  }

  const selected = source[batch] || [];
  if (selected.length > 0) return selected;

  return getCategories(type, "all");
}

function parseAreas(value: any): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAreas(limitAreas?: string[]) {
  if (!limitAreas || limitAreas.length === 0) return geoAreas;

  const normalized = limitAreas.map((area) => area.toLowerCase());

  return geoAreas.filter((area) =>
    normalized.some((name) => area.name.toLowerCase().includes(name))
  );
}

function defaultQueries(
  type: ImportType,
  batch: ImportBatch = "core",
  areaNames?: string[]
) {
  const areas = getAreas(areaNames).map((area) => area.name);
  const categories = getCategories(type, batch);

  return areas.flatMap((area) =>
    categories.map((category) => `${category} in ${area}`)
  );
}

async function runImport({
  queries,
  type,
  limit,
  mode,
  lat,
  lng,
  radius,
  batch,
}: {
  queries: string[];
  type: ImportType;
  limit: number;
  mode: ImportMode;
  lat?: number;
  lng?: number;
  radius?: number;
  batch: ImportBatch;
}) {
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  let found = 0;

  const seenPlaceIds = new Set<string>();
  const categories = getCategories(type, batch);

  if (mode === "nearby" && lat && lng) {
    for (const category of categories) {
      if (imported >= limit) break;

      const places = await fetchGoogleNearbySearch({
        keyword: category,
        lat,
        lng,
        radius: radius || 10000,
        limit: limit - imported,
      });

      found += places.length;

      for (const place of places) {
        if (imported >= limit) break;

        if (
          !place.place_id ||
          seenPlaceIds.has(place.place_id) ||
          !isHighQuality(place)
        ) {
          continue;
        }

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
  } else {
    for (const query of queries) {
      if (imported >= limit) break;

      const remaining = limit - imported;
      const places = await fetchGooglePlacesPaged(query, remaining);

      found += places.length;

      for (const place of places) {
        if (imported >= limit) break;

        if (
          !place.place_id ||
          seenPlaceIds.has(place.place_id) ||
          !isHighQuality(place)
        ) {
          continue;
        }

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
  }

  return {
    success: true,
    mode,
    type,
    batch,
    requested_limit: limit,
    total_found_from_google: found,
    imported,
    skipped,
    failed,
    categories_used: categories,
    queries_used: mode === "text" ? queries : [],
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;

    const type: ImportType =
      params.get("type") === "activity" ? "activity" : "restaurant";

    const batch = normalizeBatch(params.get("batch"));
    const limit = Math.min(Number(params.get("limit") || 50), 500);

    const lat = params.get("lat") ? Number(params.get("lat")) : undefined;
    const lng = params.get("lng") ? Number(params.get("lng")) : undefined;
    const radius = params.get("radius") ? Number(params.get("radius")) : 10000;

    const mode: ImportMode = lat && lng ? "nearby" : "text";

    const areaParams = params.getAll("area");
    const areas = areaParams.length
      ? areaParams
      : parseAreas(params.get("areas"));

    const queryParams = params.getAll("query");

    const queries = queryParams.length
      ? queryParams
      : defaultQueries(type, batch, areas);

    const result = await runImport({
      queries,
      type,
      limit,
      mode,
      lat,
      lng,
      radius,
      batch,
    });

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

    const batch = normalizeBatch(body.batch);
    const limit = Math.min(Number(body.limit || 50), 500);

    const lat = body.lat ? Number(body.lat) : undefined;
    const lng = body.lng ? Number(body.lng) : undefined;
    const radius = body.radius ? Number(body.radius) : 10000;

    const mode: ImportMode = lat && lng ? "nearby" : "text";

    const areas = parseAreas(body.areas || body.area);

    const queries =
      Array.isArray(body.queries) && body.queries.length
        ? body.queries
        : body.query
          ? [body.query]
          : defaultQueries(type, batch, areas);

    const result = await runImport({
      queries,
      type,
      limit,
      mode,
      lat,
      lng,
      radius,
      batch,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}