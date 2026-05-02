import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { clampScore } from "@/lib/clampScore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const AI_MODEL = "gpt-4o-mini";
const CACHE_HOURS = 6;

const OFF_TOPIC_REPLY =
  "I can only help with RoseOut outing plans, restaurants, activities, nightlife, brunch, and date ideas.";

const FOOD_KEYWORDS = [
  "food", "eat", "restaurant", "restaurants", "breakfast", "brunch", "lunch", "dinner",
  "birthday dinner", "birthday brunch", "birthday restaurant",
  "steak", "steakhouse", "pizza", "burger", "seafood", "sushi", "ramen",
  "pasta", "italian", "mexican", "chinese", "thai", "indian",
  "mediterranean", "greek", "spanish", "bbq", "barbecue", "caribbean",
  "jamaican", "soul food", "african", "wine", "cocktail", "cocktails",
  "drinks", "bar", "rooftop", "lounge", "dessert", "coffee", "cafe",
  "hookah", "shisha", "cigar",
];

const ACTIVITY_KEYWORDS = [
  "activity", "activities", "date ideas", "birthday activities",
  "bowling", "arcade", "museum", "karaoke", "escape", "escape room",
  "mini golf", "miniature golf", "minigolf", "golf", "topgolf",
  "driving range", "axe", "axe throwing", "paintball", "paint and sip",
  "comedy", "movie", "movies", "spa", "games", "game night", "pool",
  "billiards", "jazz", "live music", "nightclub", "night club", "dance club",
];

const TAG_KEYWORDS: Record<string, string[]> = {
  birthday_dinner: ["birthday dinner", "birthday restaurant"],
  birthday_brunch: ["birthday brunch"],
  birthday: ["birthday", "celebrate", "celebration"],
  romantic: ["romantic", "date night", "intimate", "cozy", "anniversary"],
  fun: ["fun", "exciting", "games", "interactive", "competitive"],
  luxury: ["luxury", "upscale", "classy", "fine dining", "elegant"],
  chill: ["chill", "relaxed", "quiet", "laid back", "low key", "low-key"],
  nightlife: ["nightlife", "lounge", "drinks", "cocktails", "music", "bar"],
  rooftop: ["rooftop", "roof top"],
  scenic: ["view", "skyline", "waterfront", "scenic"],
};

const FOOD_INTENTS: Record<string, string[]> = {
  steak: ["steak", "steakhouse"],
  seafood: ["seafood", "fish", "lobster", "crab", "shrimp"],
  italian: ["italian", "pasta"],
  mexican: ["mexican", "taco", "tacos"],
  asian: ["asian", "sushi", "ramen", "thai", "chinese", "japanese", "korean"],
  caribbean: ["caribbean", "jamaican"],
  soul_food: ["soul food"],
  african: ["african"],
  mediterranean: ["mediterranean", "greek"],
  brunch: ["brunch"],
  breakfast: ["breakfast"],
  cafe: ["cafe", "coffee"],
  dessert: ["dessert", "ice cream", "bakery", "cake"],
  drinks: ["drinks", "cocktail", "cocktails", "wine", "bar"],
  rooftop: ["rooftop", "roof top", "view", "skyline"],
  lounge: ["lounge"],
  hookah: ["hookah", "shisha", "hookah lounge", "hookah restaurant"],
  cigar: ["cigar", "cigar lounge", "cigar bar", "cigar friendly"],
  burger: ["burger"],
  pizza: ["pizza"],
};

const ACTIVITY_INTENTS: Record<string, string[]> = {
  bowling: ["bowling", "bowl"],
  arcade: ["arcade", "games"],
  museum: ["museum", "gallery", "art"],
  karaoke: ["karaoke"],
  escape_room: ["escape room", "escape"],
  mini_golf: ["mini golf", "miniature golf", "minigolf"],
  golf: ["golf", "topgolf", "driving range", "indoor golf"],
  axe_throwing: ["axe throwing", "axe"],
  paintball: ["paintball"],
  paint_and_sip: ["paint and sip"],
  comedy: ["comedy"],
  movie: ["movie", "movies", "cinema", "theater"],
  nightclub: ["nightclub", "night club", "dance club"],
  hookah: ["hookah", "shisha", "hookah lounge", "hookah restaurant"],
  cigar: ["cigar", "cigar lounge", "cigar bar", "cigar friendly"],
  lounge: ["lounge"],
  rooftop: ["rooftop", "roof top"],
  live_music: ["live music", "jazz"],
  spa: ["spa"],
  pool: ["pool", "billiards"],
};

const PRIORITY_WEIGHTS = {
  foodExact: 320,
  activityExact: 320,
  tagExact: 140,
  vibeExact: 90,
  keyword: 18,
  phrase: 40,
  mismatchPenalty: -70,
  partialPenalty: -25,
  birthday: 170,
  rooftop: 160,
  nightlife: 150,
};

function normalizeQuery(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ");
}

function toArray(value: any): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function itemText(item: any) {
  return [
    item.location_type,
    item.restaurant_name,
    item.activity_name,
    item.name,
    item.description,
    item.address,
    item.city,
    item.state,
    item.zip_code,
    item.neighborhood,
    item.cuisine,
    item.cuisine_type,
    item.activity_type,
    item.atmosphere,
    item.lighting,
    item.noise_level,
    item.price_range,
    item.primary_tag,
    item.review_snippet,
    ...toArray(item.review_keywords),
    ...toArray(item.date_style_tags),
    ...toArray(item.search_keywords),
    ...toArray(item.best_for),
    ...toArray(item.special_features),
    ...toArray(item.signature_items),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function normalizeLocation(item: any) {
  const name = item.name || item.restaurant_name || item.activity_name || "";

  const type =
    item.location_type ||
    (item.activity_name || item.activity_type ? "activity" : "restaurant");

  return {
    ...item,
    name,
    location_type: String(type).toLowerCase(),
    restaurant_name:
      String(type).toLowerCase() === "restaurant"
        ? item.restaurant_name || name
        : item.restaurant_name,
    activity_name:
      String(type).toLowerCase() === "activity"
        ? item.activity_name || name
        : item.activity_name,
  };
}

function isRoseOutRelated(input: string) {
  const text = normalizeQuery(input);

  const allowedWords = [
    ...FOOD_KEYWORDS,
    ...ACTIVITY_KEYWORDS,
    ...Object.values(TAG_KEYWORDS).flat(),
    ...Object.values(FOOD_INTENTS).flat(),
    ...Object.values(ACTIVITY_INTENTS).flat(),
    "date",
    "outing",
    "plan",
    "plans",
    "place",
    "places",
    "near",
    "nearby",
    "nyc",
    "new york",
    "queens",
    "brooklyn",
    "manhattan",
    "bronx",
    "staten island",
  ];

  return allowedWords.some((word) => text.includes(word));
}

function detectFromMap(input: string, map: Record<string, string[]>) {
  const text = normalizeQuery(input);

  return Array.from(
    new Set(
      Object.entries(map)
        .filter(([, keywords]) =>
          keywords.some((keyword) => text.includes(keyword))
        )
        .map(([key]) => key)
    )
  );
}

function buildWantsMap(keys: string[], selected: string[]) {
  const map: Record<string, boolean> = {};

  keys.forEach((key) => {
    map[`wants_${key}`] = selected.includes(key);
  });

  return map;
}

function itemHasTag(item: any, tag: string) {
  const searchable = itemText(item);

  const directTags = [
    item.activity_type,
    item.primary_tag,
    ...toArray(item.date_style_tags),
    ...toArray(item.search_keywords),
    ...toArray(item.best_for),
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  if (directTags.includes(tag)) return true;

  const keywords = TAG_KEYWORDS[tag] || [tag.replace(/_/g, " ")];

  return keywords.some((keyword) => searchable.includes(keyword));
}

function isHookahPlace(item: any) {
  const searchable = itemText(item);

  return (
    searchable.includes("hookah") ||
    searchable.includes("shisha") ||
    searchable.includes("hookah lounge") ||
    searchable.includes("hookah restaurant")
  );
}

function isCigarPlace(item: any) {
  const searchable = itemText(item);

  return (
    searchable.includes("cigar") ||
    searchable.includes("cigar lounge") ||
    searchable.includes("cigar bar") ||
    searchable.includes("cigar friendly")
  );
}

function matchesFoodIntent(item: any, foodIntent: string) {
  if (foodIntent === "hookah") return isHookahPlace(item);
  if (foodIntent === "cigar") return isCigarPlace(item);

  const searchable = itemText(item);
  const keywords = FOOD_INTENTS[foodIntent] || [foodIntent.replace(/_/g, " ")];

  return keywords.some((keyword) => searchable.includes(keyword));
}

function matchesActivityIntent(item: any, activityIntent: string) {
  if (activityIntent === "hookah") return isHookahPlace(item);
  if (activityIntent === "cigar") return isCigarPlace(item);

  const searchable = itemText(item);

  const keywords =
    ACTIVITY_INTENTS[activityIntent] || [activityIntent.replace(/_/g, " ")];

  if (itemHasTag(item, activityIntent)) return true;

  return keywords.some((keyword) => searchable.includes(keyword));
}

function keywordBoost(item: any, input: string) {
  const searchable = itemText(item);

  const words = normalizeQuery(input)
    .split(" ")
    .filter((word) => word.length > 2);

  let boost = 0;

  words.forEach((word) => {
    if (searchable.includes(word)) boost += PRIORITY_WEIGHTS.keyword;
  });

  const phrase = normalizeQuery(input);

  if (phrase.length > 2 && searchable.includes(phrase)) {
    boost += PRIORITY_WEIGHTS.phrase;
  }

  return boost;
}

function weightedFoodBoost(item: any, foodIntents: string[]) {
  if (foodIntents.length === 0) return 0;

  let score = 0;

  foodIntents.forEach((food) => {
    score += matchesFoodIntent(item, food)
      ? PRIORITY_WEIGHTS.foodExact
      : PRIORITY_WEIGHTS.mismatchPenalty;
  });

  return score;
}

function weightedActivityBoost(item: any, activityIntents: string[]) {
  if (activityIntents.length === 0) return 0;

  let score = 0;

  activityIntents.forEach((activity) => {
    score += matchesActivityIntent(item, activity)
      ? PRIORITY_WEIGHTS.activityExact
      : PRIORITY_WEIGHTS.mismatchPenalty;
  });

  return score;
}

function weightedTagBoost(item: any, requestedTags: string[]) {
  return requestedTags.reduce((total, tag) => {
    return total + (itemHasTag(item, tag) ? PRIORITY_WEIGHTS.tagExact : 0);
  }, 0);
}

function weightedVibeBoost(item: any, vibes: string[]) {
  return vibes.reduce((total, vibe) => {
    return total + (itemHasTag(item, vibe) ? PRIORITY_WEIGHTS.vibeExact : 0);
  }, 0);
}

function hardFoodPriorityBoost(
  item: any,
  wantsFoodMap: Record<string, boolean>
) {
  let score = 0;

  Object.entries(wantsFoodMap).forEach(([key, isWanted]) => {
    if (!isWanted) return;

    const foodKey = key.replace("wants_", "");

    score += matchesFoodIntent(item, foodKey)
      ? PRIORITY_WEIGHTS.foodExact
      : PRIORITY_WEIGHTS.mismatchPenalty;
  });

  return score;
}

function hardActivityPriorityBoost(
  item: any,
  wantsActivityMap: Record<string, boolean>
) {
  let score = 0;

  Object.entries(wantsActivityMap).forEach(([key, isWanted]) => {
    if (!isWanted) return;

    const activityKey = key.replace("wants_", "");

    score += matchesActivityIntent(item, activityKey)
      ? PRIORITY_WEIGHTS.activityExact
      : PRIORITY_WEIGHTS.mismatchPenalty;
  });

  return score;
}

function detectIntent(input: string) {
  const text = normalizeQuery(input);

  const requestedTags = detectFromMap(input, TAG_KEYWORDS);
  const foodIntents = detectFromMap(input, FOOD_INTENTS);
  const activityIntents = detectFromMap(input, ACTIVITY_INTENTS);

  const wantsFoodMap = buildWantsMap(Object.keys(FOOD_INTENTS), foodIntents);
  const wantsActivityMap = buildWantsMap(
    Object.keys(ACTIVITY_INTENTS),
    activityIntents
  );

  const wantsFood =
    FOOD_KEYWORDS.some((word) => text.includes(word)) || foodIntents.length > 0;

  const wantsActivity =
    ACTIVITY_KEYWORDS.some((word) => text.includes(word)) ||
    activityIntents.length > 0;

  const allFoodOrActivityOptions = [
    ...Object.values(FOOD_INTENTS).flat(),
    ...Object.values(ACTIVITY_INTENTS).flat(),
    ...Object.values(TAG_KEYWORDS).flat(),
  ];

  const mentionsAnyRoseOutOption = allFoodOrActivityOptions.some((option) =>
    text.includes(option)
  );

  const wantsFullOuting =
    text.includes("date night") ||
    text.includes("outing") ||
    text.includes("night out") ||
    text.includes("full plan") ||
    text.includes("plan a date") ||
    text.includes("birthday plan") ||
    text.includes("birthday outing") ||
    text.includes("date idea") ||
    text.includes("date ideas") ||
    text.includes("places to go") ||
    text.includes("things to do") ||
    text.includes("with") ||
    text.includes("and") ||
    (wantsFood && wantsActivity) ||
    (foodIntents.length > 0 && activityIntents.length > 0) ||
    (mentionsAnyRoseOutOption && text.includes("date"));

  const wantsRestaurant =
    wantsFood || wantsFullOuting || (!wantsFood && !wantsActivity);

  const specificActivities = activityIntents.map((intentName) => {
    if (intentName === "escape_room") return "escape";
    if (intentName === "axe_throwing") return "axe";
    if (intentName === "paint_and_sip") return "paint and sip";
    if (intentName === "mini_golf") return "mini golf";
    return intentName;
  });

  const vibes = requestedTags.filter((tag) =>
    [
      "romantic",
      "fun",
      "luxury",
      "chill",
      "nightlife",
      "scenic",
      "birthday",
    ].includes(tag)
  );

  const multiIntentMode =
    wantsFullOuting ||
    (foodIntents.length > 0 && activityIntents.length > 0) ||
    (wantsFood && wantsActivity);

  return {
    text,
    wantsFood,
    wantsActivity,
    wantsFullOuting,
    wantsRestaurant,

    requestedTags,
    foodIntents,
    activityIntents,
    wantsFoodMap,
    wantsActivityMap,

    wantsSteak: foodIntents.includes("steak"),
    wantsSeafood: foodIntents.includes("seafood"),
    wantsItalian: foodIntents.includes("italian"),
    wantsMexican: foodIntents.includes("mexican"),
    wantsAsian: foodIntents.includes("asian"),
    wantsCaribbean: foodIntents.includes("caribbean"),
    wantsSoulFood: foodIntents.includes("soul_food"),
    wantsAfrican: foodIntents.includes("african"),
    wantsMediterranean: foodIntents.includes("mediterranean"),
    wantsBrunch: foodIntents.includes("brunch"),
    wantsBreakfast: foodIntents.includes("breakfast"),
    wantsCafe: foodIntents.includes("cafe"),
    wantsDessert: foodIntents.includes("dessert"),
    wantsDrinks: foodIntents.includes("drinks"),
    wantsBurger: foodIntents.includes("burger"),
    wantsPizza: foodIntents.includes("pizza"),

    wantsBowling: activityIntents.includes("bowling"),
    wantsArcade: activityIntents.includes("arcade"),
    wantsMuseum: activityIntents.includes("museum"),
    wantsKaraoke: activityIntents.includes("karaoke"),
    wantsEscapeRoom: activityIntents.includes("escape_room"),
    wantsMiniGolf: activityIntents.includes("mini_golf"),
    wantsGolf: activityIntents.includes("golf"),
    wantsAxeThrowing: activityIntents.includes("axe_throwing"),
    wantsPaintball: activityIntents.includes("paintball"),
    wantsPaintAndSip: activityIntents.includes("paint_and_sip"),
    wantsComedy: activityIntents.includes("comedy"),
    wantsMovie: activityIntents.includes("movie"),
    wantsNightclub: activityIntents.includes("nightclub"),
    wantsLiveMusic: activityIntents.includes("live_music"),
    wantsSpa: activityIntents.includes("spa"),
    wantsPool: activityIntents.includes("pool"),

    wantsHookah:
      foodIntents.includes("hookah") || activityIntents.includes("hookah"),
    wantsCigar:
      foodIntents.includes("cigar") || activityIntents.includes("cigar"),
    wantsLounge:
      foodIntents.includes("lounge") || activityIntents.includes("lounge"),
    wantsRooftop:
      foodIntents.includes("rooftop") ||
      activityIntents.includes("rooftop") ||
      requestedTags.includes("rooftop"),

    wantsBirthday: text.includes("birthday"),
    wantsBirthdayDinner: text.includes("birthday dinner"),
    wantsBirthdayBrunch: text.includes("birthday brunch"),

    specificActivities,
    vibes,
    multiIntentMode,
  };
}

function matchesSpecificActivity(item: any, specificActivity: string) {
  if (specificActivity === "bowling") return matchesActivityIntent(item, "bowling");
  if (specificActivity === "arcade") return matchesActivityIntent(item, "arcade");
  if (specificActivity === "museum") return matchesActivityIntent(item, "museum");
  if (specificActivity === "karaoke") return matchesActivityIntent(item, "karaoke");
  if (specificActivity === "escape") return matchesActivityIntent(item, "escape_room");
  if (specificActivity === "mini golf") return matchesActivityIntent(item, "mini_golf");
  if (specificActivity === "golf") {
    return (
      matchesActivityIntent(item, "golf") ||
      matchesActivityIntent(item, "mini_golf")
    );
  }
  if (specificActivity === "axe") return matchesActivityIntent(item, "axe_throwing");
  if (specificActivity === "paintball") return matchesActivityIntent(item, "paintball");
  if (specificActivity === "comedy") return matchesActivityIntent(item, "comedy");
  if (specificActivity === "movie") return matchesActivityIntent(item, "movie");
  if (specificActivity === "paint and sip") {
    return matchesActivityIntent(item, "paint_and_sip");
  }
  if (specificActivity === "nightclub") {
    return matchesActivityIntent(item, "nightclub");
  }

  return itemText(item).includes(specificActivity);
}

function scoreRestaurant(
  item: any,
  input: string,
  intent: ReturnType<typeof detectIntent>
) {
  const searchable = itemText(item);

  let score = 0;

  score += keywordBoost(item, input);
  score += weightedVibeBoost(item, intent.vibes);
  score += weightedTagBoost(item, intent.requestedTags);
  score += weightedFoodBoost(item, intent.foodIntents);
  score += hardFoodPriorityBoost(item, intent.wantsFoodMap);

  if (intent.wantsBirthdayDinner) score += PRIORITY_WEIGHTS.birthday;

  if (intent.wantsBirthdayBrunch && matchesFoodIntent(item, "brunch")) {
    score += PRIORITY_WEIGHTS.birthday;
  }

  if (intent.wantsRooftop && matchesFoodIntent(item, "rooftop")) {
    score += PRIORITY_WEIGHTS.rooftop;
  }

  if (intent.wantsHookah) {
    if (isHookahPlace(item)) {
      score += PRIORITY_WEIGHTS.nightlife + PRIORITY_WEIGHTS.foodExact;
    } else {
      score += PRIORITY_WEIGHTS.mismatchPenalty;
    }
  }

  if (intent.wantsCigar) {
    if (isCigarPlace(item)) {
      score += PRIORITY_WEIGHTS.nightlife + PRIORITY_WEIGHTS.foodExact;
    } else {
      score += PRIORITY_WEIGHTS.mismatchPenalty;
    }
  }

  if (intent.wantsLounge && matchesFoodIntent(item, "lounge")) {
    score += PRIORITY_WEIGHTS.nightlife;
  }

  if (intent.wantsDrinks && matchesFoodIntent(item, "drinks")) {
    score += PRIORITY_WEIGHTS.nightlife;
  }

  FOOD_KEYWORDS.forEach((keyword) => {
    if (intent.text.includes(keyword) && searchable.includes(keyword)) {
      score += 20;
    }
  });

  score += clampScore(item.roseout_score || 0) * 0.25;
  score += clampScore(item.quality_score || 0) * 0.15;
  score += clampScore(item.popularity_score || 0) * 0.1;
  score += clampScore(item.review_score || 0) * 0.2;

  return clampScore(score);
}

function scoreActivity(
  item: any,
  input: string,
  intent: ReturnType<typeof detectIntent>
) {
  let score = 0;

  score += keywordBoost(item, input);
  score += weightedVibeBoost(item, intent.vibes);
  score += weightedTagBoost(item, intent.requestedTags);
  score += weightedActivityBoost(item, intent.activityIntents);
  score += hardActivityPriorityBoost(item, intent.wantsActivityMap);

  if (intent.specificActivities.length > 0) {
    const exactMatch = intent.specificActivities.some((activity) =>
      matchesSpecificActivity(item, activity)
    );

    score += exactMatch
      ? PRIORITY_WEIGHTS.activityExact
      : PRIORITY_WEIGHTS.mismatchPenalty;
  }

  if (intent.wantsBirthday) {
    if (
      itemHasTag(item, "birthday") ||
      itemHasTag(item, "fun") ||
      itemHasTag(item, "nightlife") ||
      itemHasTag(item, "rooftop") ||
      matchesActivityIntent(item, "nightclub") ||
      matchesActivityIntent(item, "comedy") ||
      matchesActivityIntent(item, "karaoke")
    ) {
      score += PRIORITY_WEIGHTS.birthday;
    }
  }

  if (intent.wantsRooftop && matchesActivityIntent(item, "rooftop")) {
    score += PRIORITY_WEIGHTS.rooftop;
  }

  if (intent.wantsHookah) {
    if (isHookahPlace(item)) {
      score += PRIORITY_WEIGHTS.nightlife + PRIORITY_WEIGHTS.activityExact;
    } else {
      score += PRIORITY_WEIGHTS.mismatchPenalty;
    }
  }

  if (intent.wantsCigar) {
    if (isCigarPlace(item)) {
      score += PRIORITY_WEIGHTS.nightlife + PRIORITY_WEIGHTS.activityExact;
    } else {
      score += PRIORITY_WEIGHTS.mismatchPenalty;
    }
  }

  if (intent.wantsLounge && matchesActivityIntent(item, "lounge")) {
    score += PRIORITY_WEIGHTS.nightlife;
  }

  if (intent.wantsNightclub && matchesActivityIntent(item, "nightclub")) {
    score += PRIORITY_WEIGHTS.nightlife;
  }

  score += clampScore(item.roseout_score || 0) * 0.25;
  score += clampScore(item.quality_score || 0) * 0.15;
  score += clampScore(item.popularity_score || 0) * 0.1;
  score += clampScore(item.review_score || 0) * 0.2;

  return clampScore(score);
}

function filterRestaurantsByFoodIntent(
  restaurants: any[],
  intent: ReturnType<typeof detectIntent>
) {
  if (intent.foodIntents.length === 0) return restaurants;

  const exactMatches = restaurants.filter((restaurant: any) =>
    intent.foodIntents.every((food) => matchesFoodIntent(restaurant, food))
  );

  if (exactMatches.length > 0) return exactMatches;

  const partialMatches = restaurants.filter((restaurant: any) =>
    intent.foodIntents.some((food) => matchesFoodIntent(restaurant, food))
  );

  return partialMatches.length > 0 ? partialMatches : restaurants;
}

function filterActivitiesByActivityIntent(
  activities: any[],
  intent: ReturnType<typeof detectIntent>
) {
  if (intent.activityIntents.length === 0) return activities;

  const exactMatches = activities.filter((activity: any) =>
    intent.activityIntents.every((activityIntent) =>
      matchesActivityIntent(activity, activityIntent)
    )
  );

  if (exactMatches.length > 0) return exactMatches;

  const partialMatches = activities.filter((activity: any) =>
    intent.activityIntents.some((activityIntent) =>
      matchesActivityIntent(activity, activityIntent)
    )
  );

  return partialMatches.length > 0 ? partialMatches : activities;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body.messages || [];
    const input = body.input || messages[messages.length - 1]?.content || "";

    if (!input) {
      return Response.json({ error: "Missing input" }, { status: 400 });
    }

    if (!isRoseOutRelated(input)) {
      return Response.json({
        reply: OFF_TOPIC_REPLY,
        intent: {
          requestedTags: [],
          foodIntents: [],
          activityIntents: [],
          wantsFoodMap: {},
          wantsActivityMap: {},
          specificActivities: [],
          vibes: [],
          multiIntentMode: false,
        },
        restaurants: [],
        activities: [],
      });
    }

    const intent = detectIntent(input);

    const cacheKey = normalizeQuery(
      `unified-locations-weighted-hookah-feature-v1-${input}`
    );

    const { data: cached } = await supabase
      .from("ai_response_cache")
      .select("response, created_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached?.response) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();

      if (cacheAge < 1000 * 60 * 60 * CACHE_HOURS) {
        return Response.json(cached.response);
      }
    }

    const { data: locationsData, error: locationsError } = await supabase
      .from("locations")
      .select("*");

    if (locationsError) {
      return Response.json({ error: locationsError.message }, { status: 500 });
    }

    const locations = (locationsData || []).map(normalizeLocation);

    const usableLocations = locations.filter((item: any) => {
      const status = String(item.status || "approved").toLowerCase();

      return status === "approved" || status === "active" || status === "";
    });

    const sourceLocations =
      usableLocations.length > 0 ? usableLocations : locations;

    let restaurants = sourceLocations.filter((item: any) => {
      const type = String(item.location_type || "").toLowerCase();

      return (
        type === "restaurant" ||
        Boolean(item.restaurant_name) ||
        Boolean(item.cuisine) ||
        Boolean(item.cuisine_type)
      );
    });

    let activities = sourceLocations.filter((item: any) => {
      const type = String(item.location_type || "").toLowerCase();

      return (
        type === "activity" ||
        Boolean(item.activity_name) ||
        Boolean(item.activity_type)
      );
    });

    restaurants = filterRestaurantsByFoodIntent(restaurants, intent);
    activities = filterActivitiesByActivityIntent(activities, intent);

    const rankedRestaurants = restaurants
      .map((restaurant: any) => ({
        ...restaurant,
        roseout_score: scoreRestaurant(restaurant, input, intent),
      }))
      .sort((a: any, b: any) => b.roseout_score - a.roseout_score);

    const rankedActivities = activities
      .map((activity: any) => ({
        ...activity,
        roseout_score: scoreActivity(activity, input, intent),
      }))
      .sort((a: any, b: any) => b.roseout_score - a.roseout_score);

    const restaurantLimit = intent.multiIntentMode ? 3 : 5;
    const activityLimit = intent.multiIntentMode ? 3 : 5;

    const topRestaurants = intent.wantsRestaurant
      ? rankedRestaurants.slice(0, restaurantLimit)
      : [];

    const topActivities =
      intent.wantsActivity || intent.wantsFullOuting
        ? rankedActivities.slice(0, activityLimit)
        : [];

    const slimRestaurants = topRestaurants.map((r: any) => ({
      name: r.restaurant_name || r.name,
      city: r.city,
      cuisine: r.cuisine || r.cuisine_type,
      score: clampScore(r.roseout_score),
      tag: r.primary_tag,
      review_keywords: toArray(r.review_keywords).slice(0, 5),
    }));

    const slimActivities = topActivities.map((a: any) => ({
      name: a.activity_name || a.name,
      city: a.city,
      type: a.activity_type,
      score: clampScore(a.roseout_score),
      tag: a.primary_tag,
      review_keywords: toArray(a.review_keywords).slice(0, 5),
    }));

    const shortConversation = messages
      .slice(-4)
      .map((m: any) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = `
You are RoseOut, a concise AI outing planner.

Conversation:
${shortConversation}

Latest user request:
"${input}"

Detected intent:
${JSON.stringify({
  wantsRestaurant: intent.wantsRestaurant,
  wantsActivity: intent.wantsActivity,
  wantsFullOuting: intent.wantsFullOuting,
  multiIntentMode: intent.multiIntentMode,
  foodIntents: intent.foodIntents,
  activityIntents: intent.activityIntents,
  wantsFoodMap: intent.wantsFoodMap,
  wantsActivityMap: intent.wantsActivityMap,
  requestedTags: intent.requestedTags,
  vibes: intent.vibes,
})}

Restaurants:
${JSON.stringify(slimRestaurants)}

Activities:
${JSON.stringify(slimActivities)}

STRICT RULES:
- Only answer RoseOut-related outing, date, restaurant, activity, nightlife, brunch, birthday, or location-planning requests.
- If the user asks anything outside RoseOut, respond exactly: "${OFF_TOPIC_REPLY}"
- Keep the answer short and direct.
- Use ONLY the listed restaurants and activities.
- Never say “I don’t have any.”
- Never ask the user to provide a list.
- Never say “let me know.”
- Treat wantsFoodMap and wantsActivityMap as strict priority signals.
- Hookah can be a restaurant feature OR standalone activity. Prioritize any listed place containing hookah/shisha.
- Cigar can be a restaurant/lounge feature OR standalone activity. Prioritize any listed place containing cigar.
- Match ALL detected food intents first when possible.
- Match ALL detected activity intents first when possible.
- If multiIntentMode is true, recommend a balanced combo: at least 1 matching restaurant and 1 matching activity when both lists are available.
- Do NOT suggest unrelated cuisines or unrelated activities.
- Do NOT invent business details.
- Do NOT add times unless asked.
- Do NOT add dessert, walks, or extra stops unless asked.
`;

    const hasResults = topRestaurants.length > 0 || topActivities.length > 0;

    const response = hasResults
      ? await openai.responses.create({
          model: AI_MODEL,
          input: prompt,
          max_output_tokens: 350,
        })
      : null;

    const responsePayload = {
      reply:
        response?.output_text ||
        "Here are strong RoseOut matches based on your vibe.",
      intent: {
        requestedTags: intent.requestedTags,
        foodIntents: intent.foodIntents,
        activityIntents: intent.activityIntents,
        wantsFoodMap: intent.wantsFoodMap,
        wantsActivityMap: intent.wantsActivityMap,
        specificActivities: intent.specificActivities,
        vibes: intent.vibes,
        multiIntentMode: intent.multiIntentMode,
      },
      restaurants: topRestaurants.map((r: any) => ({
        id: String(r.id),
        restaurant_name: r.restaurant_name || r.name,
        address: r.address,
        city: r.city,
        state: r.state,
        zip_code: r.zip_code,
        cuisine: r.cuisine || r.cuisine_type || null,
        atmosphere: r.atmosphere || null,
        price_range: r.price_range || null,
        roseout_score: clampScore(r.roseout_score),
        reservation_link: r.reservation_link,
        reservation_url: r.reservation_url || r.booking_url,
        website: r.website,
        image_url: r.image_url || null,
        rating: r.rating || null,
        review_count: r.review_count || null,
        review_score: r.review_score || null,
        review_keywords: toArray(r.review_keywords),
        review_snippet: r.review_snippet || null,
        primary_tag: r.primary_tag || null,
        date_style_tags: toArray(r.date_style_tags),
        distance_miles: r.distance_miles || null,
      })),
      activities: topActivities.map((a: any) => ({
        id: String(a.id),
        activity_name: a.activity_name || a.name,
        activity_type: a.activity_type,
        address: a.address,
        city: a.city,
        state: a.state,
        zip_code: a.zip_code,
        price_range: a.price_range,
        atmosphere: a.atmosphere,
        group_friendly: a.group_friendly,
        roseout_score: clampScore(a.roseout_score),
        reservation_link: a.reservation_link,
        reservation_url: a.reservation_url || a.booking_url,
        website: a.website,
        image_url: a.image_url || null,
        rating: a.rating || null,
        review_count: a.review_count || null,
        review_score: a.review_score || null,
        review_keywords: toArray(a.review_keywords),
        review_snippet: a.review_snippet || null,
        primary_tag: a.primary_tag || null,
        date_style_tags: toArray(a.date_style_tags),
        distance_miles: a.distance_miles || null,
      })),
    };

    await supabase.from("ai_response_cache").upsert({
      cache_key: cacheKey,
      user_query: input,
      response: responsePayload,
    });

    return Response.json(responsePayload);
  } catch (error: any) {
    console.error("GENERATE ERROR:", error);

    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}