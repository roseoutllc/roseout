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

const GENERIC_PLACE_TAGS = [
  "restaurant",
  "food",
  "establishment",
  "point of interest",
  "point_of_interest",
  "bar",
  "night club",
  "night_club",
  "cafe",
  "bakery",
  "meal takeaway",
  "meal_takeaway",
  "meal delivery",
  "meal_delivery",
  "store",
  "lodging",
  "tourist attraction",
  "tourist_attraction",
  "gym",
  "spa",
  "park",
  "shopping mall",
  "shopping_mall",
  "movie theater",
  "movie_theater",
  "bowling alley",
  "bowling_alley",
  "lounge",
  "rooftop",
  "brunch",
  "dessert",
  "drinks",
  "venue",
  "place",
  "location",
];

function normalizeTag(tag: string) {
  return tag.toLowerCase().replace(/_/g, " ").trim();
}

function isGenericTag(tag: string) {
  const normalized = normalizeTag(tag);
  return GENERIC_PLACE_TAGS.map(normalizeTag).includes(normalized);
}

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

function detectCuisine(place: any) {
  const text = placeText(place);

  const cuisineMap: Record<string, string[]> = {
    steakhouse: ["steakhouse", "steak house", "steak"],
    seafood: ["seafood", "fish", "crab", "lobster", "oyster", "shrimp", "clam"],
    italian: ["italian", "pizza", "pizzeria", "pasta", "trattoria", "ristorante"],
    japanese: ["japanese", "sushi", "ramen", "omakase", "izakaya", "yakitori", "hibachi", "teriyaki"],
    chinese: ["chinese", "dim sum", "szechuan", "sichuan", "cantonese", "hot pot", "noodle house"],
    korean: ["korean", "kbbq", "korean bbq", "bulgogi", "kimchi"],
    thai: ["thai", "pad thai"],
    vietnamese: ["vietnamese", "pho", "banh mi"],
    filipino: ["filipino", "filipina", "pinoy"],
    indian: ["indian", "tandoori", "curry", "masala", "biryani"],
    pakistani: ["pakistani"],
    bangladeshi: ["bangladeshi"],
    sri_lankan: ["sri lankan"],
    nepalese: ["nepalese", "momo"],
    mexican: ["mexican", "taco", "taqueria", "burrito", "quesadilla", "tortas"],
    tex_mex: ["tex mex", "tex-mex"],
    latin: ["latin", "latin american"],
    spanish: ["spanish", "tapas", "paella"],
    cuban: ["cuban"],
    dominican: ["dominican"],
    puerto_rican: ["puerto rican", "boricua"],
    colombian: ["colombian", "arepa"],
    peruvian: ["peruvian", "ceviche"],
    brazilian: ["brazilian", "churrasco", "rodizio"],
    argentinian: ["argentinian", "argentine"],
    caribbean: ["caribbean", "west indian"],
    jamaican: ["jamaican", "jerk chicken", "jerk"],
    haitian: ["haitian"],
    trinidadian: ["trinidadian", "trini", "roti shop"],
    soul_food: ["soul food"],
    southern: ["southern", "cajun", "creole"],
    cajun_creole: ["cajun", "creole", "gumbo", "jambalaya"],
    bbq: ["bbq", "barbecue", "smokehouse", "smoked meats"],
    american: ["american", "burger", "burgers", "wings", "diner", "grill", "gastropub"],
    comfort_food: ["comfort food"],
    mediterranean: ["mediterranean"],
    greek: ["greek", "gyro", "souvlaki"],
    turkish: ["turkish", "kebab", "doner"],
    lebanese: ["lebanese"],
    middle_eastern: ["middle eastern", "falafel", "shawarma", "hummus"],
    israeli: ["israeli"],
    moroccan: ["moroccan"],
    african: ["african"],
    west_african: ["west african"],
    nigerian: ["nigerian", "jollof", "suya"],
    ethiopian: ["ethiopian", "injera"],
    egyptian: ["egyptian"],
    french: ["french", "bistro", "brasserie"],
    german: ["german", "biergarten", "schnitzel"],
    polish: ["polish", "pierogi"],
    russian: ["russian"],
    ukrainian: ["ukrainian"],
    british: ["british", "fish and chips"],
    irish: ["irish"],
    scandinavian: ["scandinavian"],
    vegan: ["vegan", "plant based", "plant-based"],
    vegetarian: ["vegetarian"],
    halal: ["halal"],
    kosher: ["kosher"],
    gluten_free: ["gluten free", "gluten-free"],
    organic: ["organic"],
    farm_to_table: ["farm to table", "farm-to-table"],
    brunch: ["brunch", "breakfast"],
    breakfast: ["breakfast", "pancake", "waffle", "bagel"],
    bakery: ["bakery", "bake shop", "pastry", "croissant"],
    cafe: ["cafe", "coffee", "espresso", "coffee shop"],
    dessert: ["dessert", "ice cream", "gelato", "cupcake", "donut", "doughnut", "baklava"],
    juice_bar: ["juice bar", "smoothie", "açaí", "acai"],
    healthy: ["healthy", "salad", "grain bowl"],
    fast_food: ["fast food"],
    fried_chicken: ["fried chicken", "chicken shack"],
    wings: ["wings", "wing spot"],
    burger: ["burger", "burgers"],
    pizza: ["pizza", "pizzeria"],
    sandwiches: ["sandwich", "sandwiches", "subs", "hoagie", "deli"],
    deli: ["deli", "delicatessen"],
    bagels: ["bagel", "bagels"],
    hot_dogs: ["hot dog", "hot dogs"],
    noodles: ["noodle", "noodles"],
    hot_pot: ["hot pot"],
    buffet: ["buffet"],
    fine_dining: ["fine dining"],
    wine_bar: ["wine bar"],
    cocktail_bar: ["cocktail bar", "mixology"],
    sports_bar: ["sports bar"],
    lounge: ["lounge", "hookah", "shisha"],
    rooftop: ["rooftop"],
  };

  const matches: string[] = [];

  for (const [type, keywords] of Object.entries(cuisineMap)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      matches.push(type);
    }
  }

  const uniqueMatches = Array.from(new Set(matches));

  return {
    cuisine: uniqueMatches[0] || null,
    food_type: uniqueMatches[0] || null,
    cuisine_tags: uniqueMatches,
  };
}

function getPrimaryTag(place: any, type: "restaurant" | "activity") {
  const text = placeText(place);

  if (type === "restaurant") {
    const cuisineInfo = detectCuisine(place);

    if (cuisineInfo.cuisine && !isGenericTag(cuisineInfo.cuisine)) {
      return cuisineInfo.cuisine;
    }

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

function getCuisineFromPlace(place: any) {
  const cuisineInfo = detectCuisine(place);

  if (!cuisineInfo.cuisine || isGenericTag(cuisineInfo.cuisine)) {
    return null;
  }

  return cuisineInfo.cuisine;
}

function buildSearchKeywords(place: any, type: ImportType) {
  const text = placeText(place);
  const keywords = new Set<string>();

  const primaryTag = getPrimaryTag(place, type);
  if (primaryTag) keywords.add(primaryTag);

  if (type === "restaurant") {
    const cuisineInfo = detectCuisine(place);

    keywords.add("restaurant");
    keywords.add("dinner");
    keywords.add("food");
    keywords.add("date night");

    if (cuisineInfo.cuisine) keywords.add(cuisineInfo.cuisine);
    cuisineInfo.cuisine_tags.forEach((tag) => keywords.add(tag));
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
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");

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
    const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");

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
  const cuisineInfo = detectCuisine(place);

  const { error } = await supabaseAdmin.from("restaurants").insert({
    restaurant_name: place.name,
    address: addressParts.fullAddress,
    city: addressParts.city,
    state: addressParts.state,
    zip_code: addressParts.zipCode,

    cuisine: cuisineInfo.cuisine || getCuisineFromPlace(place),
    food_type: cuisineInfo.food_type,
    cuisine_tags: cuisineInfo.cuisine_tags,

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
    primary_tag: primaryTag || cuisineInfo.cuisine || "restaurant",
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