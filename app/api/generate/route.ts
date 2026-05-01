import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { clampScore } from "@/lib/clampScore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const AI_MODEL = "gpt-4o-mini";
const CACHE_HOURS = 6;

const EXPERIENCE_KEYWORDS = [
  "food",
  "eat",
  "restaurant",
  "breakfast",
  "brunch",
  "lunch",
  "dinner",
  "pizza",
  "burger",
  "steak",
  "steakhouse",
  "seafood",
  "sushi",
  "ramen",
  "pasta",
  "italian",
  "mexican",
  "chinese",
  "thai",
  "indian",
  "mediterranean",
  "greek",
  "spanish",
  "bbq",
  "barbecue",
  "caribbean",
  "jamaican",
  "soul food",
  "african",
  "wine",
  "cocktail",
  "cocktails",
  "drinks",
  "bar",
  "rooftop",
  "lounge",
  "dessert",
  "coffee",
  "cafe",
  "hookah",
  "hookah lounge",
  "hookah restaurant",
  "shisha",
  "shisha lounge",
  "cigar",
  "cigar bar",
  "cigar lounge",
  "cigar friendly",
];

function normalizeQuery(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

function toArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);

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

function keywordBoost(item: any, input: string) {
  const searchable = itemText(item);
  const words = normalizeQuery(input)
    .split(" ")
    .filter((word) => word.length > 2);

  let boost = 0;

  words.forEach((word) => {
    if (searchable.includes(word)) boost += 18;
  });

  const phrase = normalizeQuery(input);
  if (phrase.length > 2 && searchable.includes(phrase)) boost += 35;

  return boost;
}

function scoreRestaurant(item: any, input: string) {
  const text = input.toLowerCase();
  const searchable = itemText(item);
  const cuisine = String(item.cuisine || item.cuisine_type || "").toLowerCase();

  let score = 0;

  score += keywordBoost(item, input);

  EXPERIENCE_KEYWORDS.forEach((keyword) => {
    if (text.includes(keyword) && searchable.includes(keyword)) score += 25;
  });

  if (text.includes("steak") || text.includes("steakhouse")) {
    if (
      searchable.includes("steak") ||
      searchable.includes("steakhouse") ||
      cuisine.includes("steak")
    ) {
      score += 180;
    } else {
      score += 35;
    }
  }

  if (text.includes("hookah") || text.includes("shisha")) {
    if (searchable.includes("hookah") || searchable.includes("shisha")) {
      score += 180;
    } else if (searchable.includes("lounge") || searchable.includes("bar")) {
      score += 60;
    } else {
      score += 25;
    }
  }

  if (text.includes("cigar")) {
    if (searchable.includes("cigar")) {
      score += 180;
    } else if (searchable.includes("lounge") || searchable.includes("bar")) {
      score += 60;
    } else {
      score += 25;
    }
  }

  if (text.includes("lounge") && searchable.includes("lounge")) score += 90;
  if (text.includes("dinner")) score += 30;
  if (text.includes("breakfast") && searchable.includes("breakfast")) score += 45;
  if (text.includes("brunch") && searchable.includes("brunch")) score += 45;
  if (text.includes("lunch") && searchable.includes("lunch")) score += 35;
  if (text.includes("wine") && searchable.includes("wine")) score += 60;
  if (text.includes("cocktail") && searchable.includes("cocktail")) score += 50;
  if (text.includes("drinks") && searchable.includes("drink")) score += 40;
  if (text.includes("bar") && searchable.includes("bar")) score += 40;

  score += clampScore(item.roseout_score || 0) * 0.25;
  score += clampScore(item.quality_score || 0) * 0.15;
  score += clampScore(item.popularity_score || 0) * 0.1;
  score += clampScore(item.review_score || 0) * 0.15;

  return clampScore(score);
}

function scoreActivity(item: any, input: string) {
  const text = input.toLowerCase();
  const searchable = itemText(item);

  let score = 0;

  score += keywordBoost(item, input);

  if (text.includes("museum") && searchable.includes("museum")) score += 100;
  if (text.includes("bowling") && searchable.includes("bowling")) score += 100;
  if (text.includes("arcade") && searchable.includes("arcade")) score += 100;
  if (text.includes("karaoke") && searchable.includes("karaoke")) score += 100;
  if (text.includes("escape") && searchable.includes("escape")) score += 100;
  if (text.includes("mini golf") && searchable.includes("mini golf")) score += 100;
  if (text.includes("fun") && searchable.includes("fun")) score += 40;

  score += clampScore(item.roseout_score || 0) * 0.25;
  score += clampScore(item.quality_score || 0) * 0.15;
  score += clampScore(item.popularity_score || 0) * 0.1;
  score += clampScore(item.review_score || 0) * 0.15;

  return clampScore(score);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body.messages || [];
    const input = body.input || messages[messages.length - 1]?.content || "";

    if (!input) {
      return Response.json({ error: "Missing input" }, { status: 400 });
    }

    const text = input.toLowerCase();

    const cacheKey = normalizeQuery(`stable-restaurant-activity-search-${input}`);

    const { data: cached } = await supabase
      .from("ai_response_cache")
      .select("response, created_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached?.response) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      const cacheLimit = 1000 * 60 * 60 * CACHE_HOURS;

      if (cacheAge < cacheLimit) {
        return Response.json(cached.response);
      }
    }

    const wantsFood = EXPERIENCE_KEYWORDS.some((keyword) =>
      text.includes(keyword)
    );

    const wantsActivity =
      text.includes("activity") ||
      text.includes("activities") ||
      text.includes("museum") ||
      text.includes("bowling") ||
      text.includes("arcade") ||
      text.includes("karaoke") ||
      text.includes("escape") ||
      text.includes("mini golf");

    const wantsFullOuting =
      text.includes("date night") ||
      text.includes("outing") ||
      text.includes("night out") ||
      text.includes("full plan");

    const shouldReturnRestaurants =
      wantsFood || wantsFullOuting || !wantsActivity;

    const shouldReturnActivities = wantsActivity || wantsFullOuting;

    const { data: restaurantsData, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*")
      .or("status.eq.approved,status.is.null,status.eq.active");

    if (restaurantError) {
      return Response.json({ error: restaurantError.message }, { status: 500 });
    }

    const { data: activitiesData, error: activityError } = await supabase
      .from("activities")
      .select("*")
      .or("status.eq.approved,status.is.null,status.eq.active");

    if (activityError) {
      return Response.json({ error: activityError.message }, { status: 500 });
    }

    const restaurants = restaurantsData || [];
    const activities = activitiesData || [];

    const rankedRestaurants = restaurants
      .map((restaurant: any) => ({
        ...restaurant,
        roseout_score: scoreRestaurant(restaurant, input),
      }))
      .sort((a: any, b: any) => b.roseout_score - a.roseout_score);

    const rankedActivities = activities
      .map((activity: any) => ({
        ...activity,
        roseout_score: scoreActivity(activity, input),
      }))
      .sort((a: any, b: any) => b.roseout_score - a.roseout_score);

    const topRestaurants = shouldReturnRestaurants
      ? rankedRestaurants.length > 0
        ? rankedRestaurants.slice(0, 5)
        : restaurants.slice(0, 5)
      : [];

    const topActivities = shouldReturnActivities
      ? rankedActivities.length > 0
        ? rankedActivities.slice(0, 5)
        : activities.slice(0, 5)
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

Restaurants:
${JSON.stringify(slimRestaurants)}

Activities:
${JSON.stringify(slimActivities)}

STRICT RULES:
- Keep the answer short and direct.
- Use ONLY the listed restaurants and activities.
- Never say “I don’t have any.”
- Never say “I currently don’t have any.”
- Never say “Would you like to explore other options.”
- Never ask the user to provide a list.
- If exact matches are weak, recommend the closest available matches from the list.
- If the user asks for steak and no steakhouse appears, recommend the closest upscale dinner restaurants from the list.
- If the user asks for hookah/shisha/cigar and no exact venue appears, recommend the closest lounge/nightlife/dining matches from the list.
- Do NOT invent business details.
- Do NOT add times unless asked.
- If dinner only, recommend restaurants only.
- If activity only, recommend activities only.
- If full outing/date night, recommend one restaurant and one activity.
`;

    const response = await openai.responses.create({
      model: AI_MODEL,
      input: prompt,
      max_output_tokens: 350,
    });

    const responsePayload = {
      reply: response.output_text || "Here are the closest RoseOut matches.",

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
        reservation_url: r.reservation_url,
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
        reservation_url: a.reservation_url,
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