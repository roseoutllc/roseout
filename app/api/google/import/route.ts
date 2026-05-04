import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClaimQr } from "@/lib/claimQr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ImportType = "restaurant" | "activity";
type RequestImportType = ImportType | "both";
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

async function logImportRun(result: any, errorMessage?: string) {
  try {
    await supabaseAdmin.from("import_logs").insert({
      job_name: "daily_google_import",
      run_date: new Date().toISOString().split("T")[0],
      meta: result || {},
      error: errorMessage || null,
    });
  } catch (err) {
    console.error("Import logging failed:", err);
  }
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

function cleanAddress(address: string | null) {
  if (!address) return null;

  return address
    .replace(/,\s*USA$/i, "")
    .replace(/,\s*United States$/i, "")
    .trim();
}

function parseAddressParts(address: string | null) {
  const cleaned = cleanAddress(address);

  if (!cleaned) {
    return {
      fullAddress: null,
      city: null,
      state: null,
      zipCode: null,
    };
  }

  const parts = cleaned.split(",").map((part) => part.trim());
  const city = parts.length >= 2 ? parts[parts.length - 2] : null;
  const stateZip = parts.length >= 3 ? parts[parts.length - 1] : null;
  const match = stateZip?.match(/^([A-Z]{2})\s+(\d{5})(?:-\d{4})?$/);

  return {
    fullAddress: cleaned,
    city,
    state: match?.[1] || null,
    zipCode: match?.[2] || null,
  };
}

function getReviewCount(place: any) {
  return Number(
    place.user_ratings_total ??
      place.userRatingCount ??
      place.review_count ??
      place.reviews ??
      0
  );
}

function calculateImportScores(place: any) {
  const rating = Number(place.rating || 0);
  const reviews = getReviewCount(place);
  const hasPhoto = Boolean(place.photos?.length);

  const reviewScore = Math.min(Math.round((rating / 5) * 40), 40);

  const popularityScore = Math.min(
    Math.round(Math.log10(Math.max(reviews, 1)) * 15),
    35
  );

  const qualityScore = Math.min(
    reviewScore + popularityScore + (hasPhoto ? 10 : 0),
    100
  );

  const trendScore = Math.min(Math.round(reviews / 10), 100);
  const conversionScore = Math.min(Math.round((rating * reviews) / 100), 100);

  const roseoutScore = Math.min(
    100,
    Math.round(
      qualityScore * 0.5 +
        popularityScore * 0.2 +
        reviewScore * 0.2 +
        trendScore * 0.1
    )
  );

  return {
    quality_score: qualityScore,
    review_score: reviewScore,
    popularity_score: popularityScore,
    roseout_score: roseoutScore,
    trend_score: trendScore,
    conversion_score: conversionScore,
  };
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

function getCuisineFromPlace(place: any) {
  const tag = getPrimaryTag(place, "restaurant");

  const genericTags = ["restaurant", "bar", "cafe", "lounge", "rooftop"];

  if (!tag || genericTags.includes(tag)) {
    return null;
  }

  return tag;
}
  const text = placeText(place);

  if (type === "restaurant") {
    if (text.includes("steakhouse") || text.includes("steak")) return "steak";

    if (
      text.includes("seafood") ||
      text.includes("fish") ||
      text.includes("crab") ||
      text.includes("lobster") ||
      text.includes("oyster")
    ) {
      return "seafood";
    }

    if (text.includes("sushi") || text.includes("omakase")) return "sushi";
    if (text.includes("ramen")) return "ramen";
    if (text.includes("japanese") || text.includes("izakaya")) return "japanese";
    if (text.includes("korean") || text.includes("kbbq")) return "korean";
    if (text.includes("thai")) return "thai";
    if (text.includes("vietnamese") || text.includes("pho")) return "vietnamese";

    if (
      text.includes("chinese") ||
      text.includes("dim sum") ||
      text.includes("szechuan") ||
      text.includes("sichuan")
    ) {
      return "chinese";
    }

    if (text.includes("indian")) return "indian";
    if (text.includes("italian") || text.includes("pizza") || text.includes("pasta")) return "italian";
    if (text.includes("mexican") || text.includes("taco") || text.includes("taqueria")) return "mexican";
    if (text.includes("peruvian")) return "peruvian";
    if (text.includes("dominican")) return "dominican";
    if (text.includes("puerto rican")) return "puerto_rican";
    if (text.includes("cuban")) return "cuban";
    if (text.includes("jamaican")) return "jamaican";
    if (text.includes("haitian")) return "haitian";
    if (text.includes("caribbean") || text.includes("west indian")) return "caribbean";
    if (text.includes("latin") || text.includes("spanish")) return "latin";

    if (text.includes("soul food") || text.includes("southern")) return "soul_food";

    if (
      text.includes("bbq") ||
      text.includes("barbecue") ||
      text.includes("smokehouse")
    ) {
      return "bbq";
    }

    if (text.includes("burger")) return "burgers";
    if (text.includes("wings")) return "wings";
    if (text.includes("chicken")) return "chicken";

    if (text.includes("vegan")) return "vegan";
    if (text.includes("vegetarian")) return "vegetarian";
    if (text.includes("halal")) return "halal";
    if (text.includes("kosher")) return "kosher";

    if (text.includes("brunch") || text.includes("breakfast")) return "brunch";
    if (text.includes("bakery") || text.includes("bake shop")) return "bakery";

    if (
      text.includes("dessert") ||
      text.includes("ice cream") ||
      text.includes("gelato")
    ) {
      return "dessert";
    }

    if (text.includes("cafe") || text.includes("coffee")) return "cafe";

    if (text.includes("rooftop")) return "rooftop";
    if (text.includes("hookah") || text.includes("shisha")) return "hookah";
    if (text.includes("cigar")) return "cigar";
    if (text.includes("lounge")) return "lounge";
    if (text.includes("bar")) return "bar";

    return "restaurant";
  }

  if (text.includes("bowling")) return "bowling";
  if (text.includes("arcade")) return "arcade";
  if (text.includes("karaoke")) return "karaoke";
  if (text.includes("escape")) return "escape_room";
  if (text.includes("paintball")) return "paintball";
  if (text.includes("axe")) return "axe_throwing";
  if (text.includes("comedy")) return "comedy";
  if (text.includes("jazz") || text.includes("live music")) return "live_music";
  if (text.includes("museum")) return "museum";
  if (text.includes("gallery") || text.includes("art")) return "art_gallery";
  if (text.includes("theater") || text.includes("theatre")) return "theater";
  if (text.includes("nightclub") || text.includes("club")) return "nightlife";
  if (text.includes("hookah") || text.includes("shisha")) return "hookah";
  if (text.includes("cigar")) return "cigar";

  return "activity";
}

function buildSearchKeywords(place: any, type: ImportType) {
  const text = placeText(place);
  const keywords = new Set<string>();

  const primaryTag = getPrimaryTag(place, type);
  if (primaryTag) keywords.add(primaryTag);

  if (type === "restaurant") {
    keywords.add("restaurant");
    keywords.add("dinner");
    keywords.add("food");
    keywords.add("date night");
  } else {
    keywords.add("activity");
    keywords.add("things to do");
    keywords.add("date idea");
    keywords.add("experience");
  }

  if (
    text.includes("romantic") ||
    text.includes("intimate") ||
    text.includes("cozy") ||
    text.includes("candle")
  ) {
    keywords.add("romantic");
    keywords.add("couples");
    keywords.add("date night");
  }

  if (
    text.includes("birthday") ||
    text.includes("celebration") ||
    text.includes("party") ||
    text.includes("group")
  ) {
    keywords.add("birthday");
    keywords.add("celebration");
    keywords.add("group");
  }

  if (
    text.includes("luxury") ||
    text.includes("upscale") ||
    text.includes("fine dining") ||
    text.includes("elegant") ||
    text.includes("michelin") ||
    text.includes("tasting menu")
  ) {
    keywords.add("luxury");
    keywords.add("upscale");
    keywords.add("premium");
  }

  if (text.includes("brunch")) keywords.add("brunch");
  if (text.includes("breakfast")) keywords.add("breakfast");
  if (text.includes("cafe") || text.includes("coffee")) keywords.add("cafe");
  if (text.includes("rooftop")) keywords.add("rooftop");
  if (text.includes("waterfront")) keywords.add("waterfront");
  if (text.includes("outdoor")) keywords.add("outdoor");
  if (text.includes("live music")) keywords.add("live music");
  if (text.includes("jazz")) keywords.add("jazz");
  if (text.includes("comedy")) keywords.add("comedy");
  if (text.includes("bowling")) keywords.add("bowling");
  if (text.includes("karaoke")) keywords.add("karaoke");
  if (text.includes("arcade")) keywords.add("arcade");
  if (text.includes("museum")) keywords.add("museum");
  if (text.includes("art")) keywords.add("art");
  if (text.includes("theater") || text.includes("theatre")) keywords.add("theater");
  if (text.includes("park")) keywords.add("park");

  if (text.includes("hookah") || text.includes("shisha")) {
    keywords.add("hookah");
    keywords.add("shisha");
    keywords.add("hookah lounge");
    if (type === "restaurant") keywords.add("hookah restaurant");
  }

  if (text.includes("cigar")) {
    keywords.add("cigar");
    keywords.add("cigar lounge");
    keywords.add("cigar bar");
  }

  return Array.from(keywords);
}

function isHighQuality(place: any) {
  const rating = Number(place.rating || 0);
  const reviews = getReviewCount(place);

  if (!place.name) return false;
  if (!place.formatted_address && !place.vicinity) return false;
  if (rating < 4.0) return false;
  if (reviews < 50) return false;

  return true;
}

function getCategoryFromQuery(query: string, categories: string[]) {
  const lower = query.toLowerCase();

  const matched = categories.find((category) =>
    lower.includes(category.toLowerCase())
  );

  if (matched) return matched;

  return lower.split(/\s+in\s+/)[0]?.trim() || lower;
}

function isRestaurantLike(place: any) {
  const types = place.types || [];
  const text = placeText(place);

  return (
    types.includes("restaurant") ||
    types.includes("food") ||
    types.includes("meal_takeaway") ||
    types.includes("meal_delivery") ||
    types.includes("cafe") ||
    types.includes("bakery") ||
    text.includes("restaurant") ||
    text.includes("diner") ||
    text.includes("grill") ||
    text.includes("kitchen") ||
    text.includes("steakhouse") ||
    text.includes("pizzeria")
  );
}

function isActivityLike(place: any) {
  const types = place.types || [];
  const text = placeText(place);

  return (
    types.includes("amusement_park") ||
    types.includes("bowling_alley") ||
    types.includes("museum") ||
    types.includes("art_gallery") ||
    types.includes("movie_theater") ||
    types.includes("night_club") ||
    types.includes("park") ||
    types.includes("tourist_attraction") ||
    text.includes("bowling") ||
    text.includes("karaoke") ||
    text.includes("arcade") ||
    text.includes("escape") ||
    text.includes("comedy") ||
    text.includes("museum") ||
    text.includes("gallery") ||
    text.includes("paint and sip") ||
    text.includes("mini golf") ||
    text.includes("axe throwing") ||
    text.includes("live music") ||
    text.includes("jazz")
  );
}

function categoryMatchesPlace(place: any, type: ImportType, category: string) {
  const text = placeText(place);
  const cat = category.toLowerCase();

  if (type === "restaurant") {
    if (!isRestaurantLike(place)) return false;

    if (cat.includes("steak")) return text.includes("steak") || text.includes("steakhouse");
    if (cat.includes("seafood")) return text.includes("seafood") || text.includes("fish") || text.includes("crab") || text.includes("lobster") || text.includes("oyster");
    if (cat.includes("sushi")) return text.includes("sushi") || text.includes("japanese");
    if (cat.includes("italian")) return text.includes("italian") || text.includes("pizza") || text.includes("pasta");
    if (cat.includes("mexican")) return text.includes("mexican") || text.includes("taco");
    if (cat.includes("caribbean")) return text.includes("caribbean") || text.includes("jamaican") || text.includes("haitian") || text.includes("trinidad");
    if (cat.includes("brunch")) return text.includes("brunch") || text.includes("breakfast") || text.includes("cafe");
    if (cat.includes("hookah")) return text.includes("hookah") || text.includes("shisha");
    if (cat.includes("cigar")) return text.includes("cigar");

    return true;
  }

  const nightlifeAllowed =
    cat.includes("nightlife") ||
    cat.includes("lounge") ||
    cat.includes("hookah") ||
    cat.includes("cigar") ||
    cat.includes("bar") ||
    cat.includes("club");

  if (isRestaurantLike(place) && !nightlifeAllowed && !isActivityLike(place)) {
    return false;
  }

  if (cat.includes("bowling")) return text.includes("bowling");
  if (cat.includes("arcade")) return text.includes("arcade") || text.includes("games");
  if (cat.includes("karaoke")) return text.includes("karaoke");
  if (cat.includes("escape")) return text.includes("escape");
  if (cat.includes("mini golf") || cat.includes("miniature golf")) return text.includes("mini golf") || text.includes("miniature golf") || text.includes("minigolf");
  if (cat.includes("axe")) return text.includes("axe");
  if (cat.includes("paintball")) return text.includes("paintball");
  if (cat.includes("comedy")) return text.includes("comedy") || text.includes("stand up");
  if (cat.includes("museum")) return text.includes("museum");
  if (cat.includes("gallery")) return text.includes("gallery") || text.includes("art");
  if (cat.includes("theater") || cat.includes("theatre")) return text.includes("theater") || text.includes("theatre");
  if (cat.includes("hookah")) return text.includes("hookah") || text.includes("shisha");
  if (cat.includes("cigar")) return text.includes("cigar");

  return isActivityLike(place) || nightlifeAllowed;
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
  if (text.includes("comedy") || text.includes("stand up")) return "comedy";
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

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
) {
  const results: R[] = [];
  let index = 0;

  async function runWorker() {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runWorker()
  );

  await Promise.all(workers);

  return results;
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

    if (!res.ok) break;

    if (data.status === "INVALID_REQUEST") {
      if (nextPageToken && tokenRetryCount < 5) {
        tokenRetryCount++;
        await sleep(3000);
        continue;
      }
      break;
    }

    if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.warn("Google text query error:", {
        query,
        status: data.status,
        error_message: data.error_message,
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

    if (!res.ok) break;

    if (data.status === "INVALID_REQUEST") {
      if (nextPageToken && tokenRetryCount < 5) {
        tokenRetryCount++;
        await sleep(3000);
        continue;
      }
      break;
    }

    if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.warn("Google nearby query error:", {
        keyword,
        status: data.status,
        error_message: data.error_message,
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
  const scores = calculateImportScores(place);

  const addressParts = parseAddressParts(
    place.formatted_address || place.vicinity || null
  );

  const primaryTag = getPrimaryTag(place, "restaurant");

  const { error } = await supabaseAdmin.from("restaurants").insert({
    restaurant_name: place.name,
    address: addressParts.fullAddress,
    city: addressParts.city,
    state: addressParts.state,
    zip_code: addressParts.zipCode,
    cuisine: getCuisineFromPlace(place),
    rating: place.rating || 0,
    review_count: getReviewCount(place),
    google_place_id: place.place_id,
    image_url: googlePhotoUrl(place),
    latitude: place.geometry?.location?.lat || null,
    longitude: place.geometry?.location?.lng || null,
    status: "approved",
    claimed: false,
    view_count: 0,
    click_count: 0,
    claim_count: 0,
    primary_tag: primaryTag || "restaurant",
    search_keywords: buildSearchKeywords(place, "restaurant"),
    ...scores,
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
  const scores = calculateImportScores(place);

  const addressParts = parseAddressParts(
    place.formatted_address || place.vicinity || null
  );

  const { error } = await supabaseAdmin.from("activities").insert({
    activity_name: place.name,
    activity_type: categorizeActivity(place.name, place.types || []),
    address: addressParts.fullAddress,
    city: addressParts.city,
    state: addressParts.state,
    zip_code: addressParts.zipCode,
    rating: place.rating || 0,
    review_count: getReviewCount(place),
    google_place_id: place.place_id,
    image_url: googlePhotoUrl(place),
    latitude: place.geometry?.location?.lat || null,
    longitude: place.geometry?.location?.lng || null,
    status: "approved",
    claimed: false,
    view_count: 0,
    click_count: 0,
    claim_count: 0,
    primary_tag: getPrimaryTag(place, "activity"),
    search_keywords: buildSearchKeywords(place, "activity"),
    ...claimQr,
    ...scores,
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
  { name: "Jamaica", lat: 40.7027, lng: -73.789 },
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
  { name: "Riverhead", lat: 40.917, lng: -72.662 },
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

const rotatingBatches: ImportBatch[] = [
  "core",
  "date",
  "birthday",
  "brunch",
  "luxury",
  "nightlife",
  "fun",
  "culture",
  "outdoor",
];

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function getRotatingAreaName() {
  const day = getDayOfYear();
  return geoAreas[day % geoAreas.length]?.name || "Queens";
}

function getRotatingBatch() {
  const day = getDayOfYear();
  return rotatingBatches[day % rotatingBatches.length] || "core";
}

const restaurantCategoryBatches: Record<ImportBatch, string[]> = {
  core: ["restaurants", "best restaurants", "top rated restaurants", "new restaurants", "popular restaurants", "local restaurants", "must try restaurants", "highly rated restaurants"],
  date: ["date night restaurants", "romantic restaurants", "intimate restaurants", "cozy restaurants", "anniversary restaurants", "first date restaurants", "casual date restaurants", "quiet restaurants", "candlelight restaurants", "restaurants for couples"],
  birthday: ["birthday dinner restaurants", "birthday brunch restaurants", "birthday celebration restaurants", "birthday restaurants", "birthday rooftop restaurants", "birthday fine dining", "restaurants for celebrations", "group dinner restaurants", "private dining restaurants", "restaurants for large groups", "party restaurants"],
  brunch: ["breakfast restaurants", "brunch restaurants", "best brunch", "bottomless brunch", "birthday brunch restaurants", "lunch restaurants", "coffee shops", "cafes", "bakeries", "dessert spots", "ice cream shops", "tea houses", "juice bars", "smoothie shops"],
  luxury: ["fine dining restaurants", "luxury restaurants", "upscale restaurants", "michelin star restaurants", "tasting menu restaurants", "chef tasting restaurants", "rooftop restaurants", "restaurants with a view", "waterfront restaurants", "outdoor dining restaurants", "garden restaurants", "steakhouses", "seafood restaurants", "wine restaurants", "elegant restaurants", "high end restaurants"],
  nightlife: ["late night restaurants", "24 hour restaurants", "lounge restaurants", "restaurants with music", "restaurants with dj", "live music restaurants", "jazz restaurants", "restaurants with dancing", "cocktail bars", "wine bars", "sports bars", "rooftop bars", "bars with food", "gastropubs", "hookah restaurants", "hookah lounges", "shisha lounges", "hookah bars", "cigar lounges", "cigar bars", "supper clubs"],
  cuisine: ["american restaurants", "new american restaurants", "southern restaurants", "soul food restaurants", "comfort food restaurants", "bbq restaurants", "barbecue restaurants", "smokehouse restaurants", "steakhouses", "burger restaurants", "hot dog restaurants", "sandwich shops", "delis", "diners", "seafood restaurants", "lobster restaurants", "crab restaurants", "oyster bars", "fish restaurants", "italian restaurants", "pizza restaurants", "pasta restaurants", "sicilian restaurants", "french restaurants", "bistros", "spanish restaurants", "tapas restaurants", "portuguese restaurants", "greek restaurants", "mediterranean restaurants", "turkish restaurants", "lebanese restaurants", "middle eastern restaurants", "israeli restaurants", "persian restaurants", "moroccan restaurants", "halal restaurants", "kosher restaurants", "chinese restaurants", "dim sum restaurants", "cantonese restaurants", "szechuan restaurants", "shanghainese restaurants", "hot pot restaurants", "japanese restaurants", "sushi restaurants", "ramen restaurants", "izakaya restaurants", "yakitori restaurants", "korean restaurants", "korean bbq restaurants", "thai restaurants", "vietnamese restaurants", "pho restaurants", "malaysian restaurants", "singaporean restaurants", "indonesian restaurants", "filipino restaurants", "asian fusion restaurants", "indian restaurants", "pakistani restaurants", "bangladeshi restaurants", "nepalese restaurants", "tibetan restaurants", "mexican restaurants", "taco restaurants", "tex mex restaurants", "latin restaurants", "peruvian restaurants", "dominican restaurants", "puerto rican restaurants", "colombian restaurants", "cuban restaurants", "argentinian restaurants", "brazilian restaurants", "venezuelan restaurants", "ecuadorian restaurants", "salvadoran restaurants", "caribbean restaurants", "jamaican restaurants", "haitian restaurants", "trinidadian restaurants", "west indian restaurants", "african restaurants", "ethiopian restaurants", "nigerian restaurants", "ghanaian restaurants", "senegalese restaurants", "south african restaurants", "vegan restaurants", "vegetarian restaurants", "plant based restaurants", "healthy restaurants", "gluten free restaurants", "organic restaurants", "salad restaurants", "poke restaurants", "breakfast restaurants", "brunch restaurants", "dessert restaurants", "ice cream shops", "bakeries", "coffee shops", "cafes", "tea houses", "bubble tea shops"],
  casual: ["vegan restaurants", "vegetarian restaurants", "healthy restaurants", "gluten free restaurants", "instagrammable restaurants", "trendy restaurants", "hidden gem restaurants", "unique restaurants", "themed restaurants", "dinner restaurants", "fun restaurants", "family restaurants", "casual restaurants", "comfort food restaurants", "pizza restaurants", "taco restaurants", "sandwich shops", "food halls", "food trucks"],
  activity: [],
  fun: [],
  culture: [],
  outdoor: [],
  all: [],
};

const activityCategoryBatches: Record<ImportBatch, string[]> = {
  activity: ["things to do", "date night activities", "romantic things to do", "birthday activities", "birthday date ideas", "fun activities", "couples activities", "double date ideas", "indoor activities", "unique things to do", "experiences", "local attractions"],
  date: ["romantic things to do", "date night activities", "couples activities", "fun date ideas", "unique date ideas", "romantic activities", "things to do for couples", "wine tasting", "paint and sip", "cooking classes", "dance classes", "jazz clubs", "live music"],
  birthday: ["birthday activities", "birthday party venues", "birthday date ideas", "fun birthday activities", "group activities", "private party venues", "karaoke rooms", "arcades", "bowling", "paint and sip", "escape rooms", "comedy clubs", "nightclubs", "lounges"],
  fun: ["bowling", "arcades", "karaoke", "escape rooms", "mini golf", "miniature golf", "golf", "indoor golf", "driving range", "axe throwing", "paintball", "laser tag", "go karts", "trampoline parks", "roller skating", "ice skating", "pool halls", "billiards", "board game cafes", "virtual reality arcade", "paint and sip"],
  nightlife: ["comedy clubs", "comedy club", "stand up comedy", "stand up comedy clubs", "comedy shows", "comedy night", "nightclubs", "night clubs", "dance clubs", "hookah lounges", "hookah bars", "shisha lounges", "cigar lounges", "cigar bars", "lounges", "rooftop bars", "cocktail lounges", "live music", "jazz clubs", "speakeasy bars", "supper clubs", "karaoke bars"],
  culture: ["museums", "art galleries", "theaters", "movie theaters", "live shows", "broadway shows", "off broadway shows", "performing arts", "concert venues", "comedy clubs", "stand up comedy", "comedy shows", "cultural centers", "historic sites", "exhibits", "immersive exhibits"],
  outdoor: ["parks", "waterfront spots", "scenic spots", "gardens", "botanical gardens", "outdoor activities", "walking trails", "hiking trails", "beaches", "piers", "boat rides", "kayaking", "bike rentals", "rooftop activities", "outdoor markets", "farmers markets"],
  brunch: ["brunch activities", "day parties", "bottomless brunch", "brunch cruises", "coffee shops", "cafes", "bakeries", "dessert spots"],
  luxury: ["luxury experiences", "upscale lounges", "private dining", "wine tasting", "cocktail lounges", "spa experiences", "rooftop lounges", "fine dining experiences", "yacht cruises", "dinner cruises", "premium experiences"],
  core: [],
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

function normalizeRequestType(value: any): RequestImportType {
  const type = String(value || "restaurant").toLowerCase();

  if (type === "activity") return "activity";
  if (type === "all" || type === "both") return "both";

  return "restaurant";
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

  async function processPlace(place: any, category: string) {
    if (
      !place.place_id ||
      seenPlaceIds.has(place.place_id) ||
      !isHighQuality(place) ||
      !categoryMatchesPlace(place, type, category)
    ) {
      return { imported: false, skipped: false, failed: false };
    }

    seenPlaceIds.add(place.place_id);

    try {
      const result =
        type === "activity"
          ? await importActivity(place)
          : await importRestaurant(place);

      return {
        imported: Boolean(result.imported),
        skipped: Boolean(result.skipped),
        failed: false,
      };
    } catch (error) {
      console.error("Import item failed:", error);
      return { imported: false, skipped: false, failed: true };
    }
  }

  async function processBatch(places: any[], category: string) {
    const availableSlots = Math.max(limit - imported, 0);
    if (availableSlots <= 0) return;

    const candidates = places.slice(0, availableSlots * 3);
    const results = await mapWithConcurrency(candidates, 5, (place) =>
      processPlace(place, category)
    );

    for (const result of results) {
      if (imported >= limit) break;

      if (result.imported) imported++;
      if (result.skipped) skipped++;
      if (result.failed) failed++;
    }
  }

  if (mode === "nearby" && lat && lng) {
    for (const category of categories) {
      if (imported >= limit) break;

      const places = await fetchGoogleNearbySearch({
        keyword: category,
        lat,
        lng,
        radius: radius || 10000,
        limit: Math.max(limit - imported, 1),
      });

      found += places.length;

      await processBatch(places, category);
    }
  } else {
    for (const query of queries) {
      if (imported >= limit) break;

      const places = await fetchGooglePlacesPaged(query, Math.max(limit - imported, 1));

      found += places.length;

      const category = getCategoryFromQuery(query, categories);
      await processBatch(places, category);
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
    smart_filtering: true,
    speed_boost: "parallel_import_enabled",
    concurrency: 5,
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;

    const requestType = normalizeRequestType(params.get("type"));

    const batch = params.get("batch")
      ? normalizeBatch(params.get("batch"))
      : getRotatingBatch();

    const limit = Math.min(Number(params.get("limit") || 50), 500);

    const lat = params.get("lat") ? Number(params.get("lat")) : undefined;
    const lng = params.get("lng") ? Number(params.get("lng")) : undefined;
    const radius = params.get("radius") ? Number(params.get("radius")) : 10000;

    const mode: ImportMode = lat && lng ? "nearby" : "text";

    const areaParams = params.getAll("area");

    const areas = areaParams.length
      ? areaParams
      : params.get("areas")
        ? parseAreas(params.get("areas"))
        : [getRotatingAreaName()];

    const queryParams = params.getAll("query");

    if (requestType === "both") {
      const restaurantLimit = Math.ceil(limit / 2);
      const activityLimit = Math.floor(limit / 2);

      const restaurantQueries = queryParams.length
        ? queryParams
        : defaultQueries("restaurant", batch, areas);

      const activityQueries = queryParams.length
        ? queryParams
        : defaultQueries("activity", batch, areas);

      const restaurantResult = await runImport({
        queries: restaurantQueries,
        type: "restaurant",
        limit: restaurantLimit,
        mode,
        lat,
        lng,
        radius,
        batch,
      });

      const activityResult = await runImport({
        queries: activityQueries,
        type: "activity",
        limit: activityLimit,
        mode,
        lat,
        lng,
        radius,
        batch,
      });

      const result = {
        success: true,
        mode,
        type: "both",
        batch,
        areas,
        requested_limit: limit,
        balance: {
          restaurant_limit: restaurantLimit,
          activity_limit: activityLimit,
        },
        imported: restaurantResult.imported + activityResult.imported,
        skipped: restaurantResult.skipped + activityResult.skipped,
        failed: restaurantResult.failed + activityResult.failed,
        restaurant: restaurantResult,
        activity: activityResult,
        smart_filtering: true,
        rotation_enabled: true,
      };

      await logImportRun(result);

      return NextResponse.json(result);
    }

    const queries = queryParams.length
      ? queryParams
      : defaultQueries(requestType, batch, areas);

    const result = await runImport({
      queries,
      type: requestType,
      limit,
      mode,
      lat,
      lng,
      radius,
      batch,
    });

    const finalResult = {
      ...result,
      areas,
      rotation_enabled: !params.get("areas") && !areaParams.length,
    };

    await logImportRun(finalResult);

    return NextResponse.json(finalResult);
  } catch (error: any) {
    await logImportRun(null, error.message || "Import failed");

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

    const requestType = normalizeRequestType(body.type);
    const batch = body.batch ? normalizeBatch(body.batch) : getRotatingBatch();

    const limit = Math.min(Number(body.limit || 50), 500);

    const lat = body.lat ? Number(body.lat) : undefined;
    const lng = body.lng ? Number(body.lng) : undefined;
    const radius = body.radius ? Number(body.radius) : 10000;

    const mode: ImportMode = lat && lng ? "nearby" : "text";

    const areas =
      body.areas || body.area
        ? parseAreas(body.areas || body.area)
        : [getRotatingAreaName()];

    if (requestType === "both") {
      const restaurantLimit = Math.ceil(limit / 2);
      const activityLimit = Math.floor(limit / 2);

      const restaurantQueries =
        Array.isArray(body.restaurantQueries) && body.restaurantQueries.length
          ? body.restaurantQueries
          : body.restaurantQuery
            ? [body.restaurantQuery]
            : defaultQueries("restaurant", batch, areas);

      const activityQueries =
        Array.isArray(body.activityQueries) && body.activityQueries.length
          ? body.activityQueries
          : body.activityQuery
            ? [body.activityQuery]
            : defaultQueries("activity", batch, areas);

      const restaurantResult = await runImport({
        queries: restaurantQueries,
        type: "restaurant",
        limit: restaurantLimit,
        mode,
        lat,
        lng,
        radius,
        batch,
      });

      const activityResult = await runImport({
        queries: activityQueries,
        type: "activity",
        limit: activityLimit,
        mode,
        lat,
        lng,
        radius,
        batch,
      });

      const result = {
        success: true,
        mode,
        type: "both",
        batch,
        areas,
        requested_limit: limit,
        balance: {
          restaurant_limit: restaurantLimit,
          activity_limit: activityLimit,
        },
        imported: restaurantResult.imported + activityResult.imported,
        skipped: restaurantResult.skipped + activityResult.skipped,
        failed: restaurantResult.failed + activityResult.failed,
        restaurant: restaurantResult,
        activity: activityResult,
        smart_filtering: true,
        rotation_enabled: true,
      };

      await logImportRun(result);

      return NextResponse.json(result);
    }

    const queries =
      Array.isArray(body.queries) && body.queries.length
        ? body.queries
        : body.query
          ? [body.query]
          : defaultQueries(requestType, batch, areas);

    const result = await runImport({
      queries,
      type: requestType,
      limit,
      mode,
      lat,
      lng,
      radius,
      batch,
    });

    const finalResult = {
      ...result,
      areas,
      rotation_enabled: !(body.areas || body.area),
    };

    await logImportRun(finalResult);

    return NextResponse.json(finalResult);
  } catch (error: any) {
    await logImportRun(null, error.message || "Import failed");

    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}