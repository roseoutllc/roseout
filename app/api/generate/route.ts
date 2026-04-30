import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const AI_MODEL = "gpt-4o-mini";
const CACHE_HOURS = 6;

const QUEENS_CITIES = [
  "Queens",
  "Astoria",
  "Flushing",
  "Jamaica",
  "Long Island City",
  "Forest Hills",
  "Bayside",
  "Queens Village",
  "Jackson Heights",
  "Corona",
  "Elmhurst",
  "Ridgewood",
  "Woodside",
  "Sunnyside",
  "Kew Gardens",
  "Rego Park",
  "Fresh Meadows",
  "College Point",
  "Whitestone",
  "Howard Beach",
  "Ozone Park",
  "South Ozone Park",
  "Far Rockaway",
  "Rockaway Beach",
  "Laurelton",
  "Rosedale",
  "Springfield Gardens",
  "Cambria Heights",
  "St. Albans",
  "Maspeth",
  "Middle Village",
  "Glendale",
  "Bellerose",
  "Little Neck",
  "Douglaston",
];

const NASSAU_CITIES = [
  "Hempstead",
  "Freeport",
  "Garden City",
  "Mineola",
  "Uniondale",
  "Westbury",
  "Rockville Centre",
  "Oceanside",
  "Levittown",
  "East Meadow",
  "Plainview",
  "Syosset",
  "Jericho",
  "Bethpage",
  "Massapequa",
  "Massapequa Park",
  "Bellmore",
  "Wantagh",
  "Merrick",
  "Great Neck",
  "Port Washington",
  "New Hyde Park",
  "Floral Park",
  "Long Beach",
  "Baldwin",
  "Glen Cove",
  "Roslyn",
  "Woodbury",
  "Carle Place",
];

const SUFFOLK_CITIES = [
  "Huntington",
  "Huntington Station",
  "Melville",
  "Smithtown",
  "Kings Park",
  "Commack",
  "Stony Brook",
  "Port Jefferson",
  "Patchogue",
  "Medford",
  "Ronkonkoma",
  "Lake Grove",
  "Centereach",
  "Selden",
  "Farmingville",
  "Holbrook",
  "Islip",
  "East Islip",
  "West Islip",
  "Bay Shore",
  "Brentwood",
  "Deer Park",
  "Babylon",
  "Lindenhurst",
  "Amityville",
  "Sayville",
  "Riverhead",
  "Southampton",
  "East Hampton",
  "Montauk",
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
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function locationText(item: any) {
  return [
    item.restaurant_name,
    item.activity_name,
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
    item.dress_code,
    item.parking_info,
    item.hours,
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
  const searchable = locationText(item);
  const words = normalizeQuery(input)
    .split(" ")
    .filter((word) => word.length > 2);

  let boost = 0;

  words.forEach((word) => {
    if (searchable.includes(word)) boost += 18;
  });

  const phrase = normalizeQuery(input);
  if (phrase.length > 2 && searchable.includes(phrase)) {
    boost += 35;
  }

  return boost;
}

function getRegion(input: string) {
  const text = normalizeQuery(input);

  if (text.includes("queens")) return "queens";
  if (text.includes("nassau")) return "nassau";
  if (text.includes("suffolk")) return "suffolk";

  if (
    text.includes("long island") ||
    text.includes("long island ny") ||
    text.includes("li ny")
  ) {
    return "long_island";
  }

  return null;
}

function getRegionCities(region: string | null) {
  if (region === "queens") return QUEENS_CITIES;
  if (region === "nassau") return NASSAU_CITIES;
  if (region === "suffolk") return SUFFOLK_CITIES;
  if (region === "long_island") return [...NASSAU_CITIES, ...SUFFOLK_CITIES];

  return [];
}

function isRegionMatch(
  region: string | null,
  city?: string | null,
  neighborhood?: string | null
) {
  const cityText = city?.toLowerCase().trim() || "";
  const neighborhoodText = neighborhood?.toLowerCase().trim() || "";
  const places = getRegionCities(region);

  return places.some((place) => {
    const normalized = place.toLowerCase();

    return cityText === normalized || neighborhoodText === normalized;
  });
}

function extractZipCode(input: string) {
  const match = input.match(/\b\d{5}\b/);
  return match ? match[0] : null;
}

function wantsNearMe(input: string) {
  const text = normalizeQuery(input);

  return (
    text.includes("near me") ||
    text.includes("nearby") ||
    text.includes("close to me") ||
    text.includes("around me") ||
    text.includes("my location")
  );
}

function extractRadiusMiles(input: string) {
  const text = input.toLowerCase();

  const match =
    text.match(/within\s+(\d+)\s*miles?/) ||
    text.match(/(\d+)\s*miles?\s*(away|radius|from me|near me)?/);

  if (!match) return 15;

  const miles = Number(match[1]);

  if (!Number.isFinite(miles) || miles <= 0) return 15;

  return Math.min(miles, 50);
}

function distanceMiles(
  lat1: number,
  lon1: number,
  lat2?: number | null,
  lon2?: number | null
) {
  if (!lat2 || !lon2) return null;

  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function scoreRestaurant(
  restaurant: any,
  input: string,
  userLocation?: { latitude: number; longitude: number } | null
) {
  const text = input.toLowerCase();
  const region = getRegion(input);
  const zipCode = extractZipCode(input);
  const searchable = locationText(restaurant);
  const cuisine = restaurant.cuisine || restaurant.cuisine_type;

  let score = 0;

  score += keywordBoost(restaurant, input);

  if (region && isRegionMatch(region, restaurant.city, restaurant.neighborhood)) {
    score += 35;
  }

  if (zipCode && restaurant.zip_code === zipCode) score += 45;

  if (userLocation && wantsNearMe(input)) {
    const distance = distanceMiles(
      userLocation.latitude,
      userLocation.longitude,
      restaurant.latitude,
      restaurant.longitude
    );

    if (distance !== null) {
      if (distance <= 3) score += 45;
      else if (distance <= 7) score += 35;
      else if (distance <= 15) score += 20;
    }
  }

  if (restaurant.city && text.includes(restaurant.city.toLowerCase())) score += 25;
  if (restaurant.neighborhood && text.includes(restaurant.neighborhood.toLowerCase())) score += 25;
  if (cuisine && text.includes(cuisine.toLowerCase())) score += 20;
  if (restaurant.atmosphere && text.includes(restaurant.atmosphere.toLowerCase())) score += 15;
  if (restaurant.lighting && text.includes(restaurant.lighting.toLowerCase())) score += 10;
  if (restaurant.noise_level && text.includes(restaurant.noise_level.toLowerCase())) score += 10;
  if (restaurant.price_range && text.includes(restaurant.price_range.toLowerCase())) score += 10;

  if (
    restaurant.primary_tag &&
    text.includes("romantic") &&
    restaurant.primary_tag.toLowerCase().includes("romantic")
  ) {
    score += 25;
  }

  if (
    toArray(restaurant.date_style_tags).some((tag) =>
      text.includes(tag.toLowerCase())
    )
  ) {
    score += 20;
  }

  if (text.includes("pizza") && cuisine?.toLowerCase().includes("pizza")) score += 25;
  if (text.includes("wine") && searchable.includes("wine")) score += 60;
  if (text.includes("cocktail") && searchable.includes("cocktail")) score += 50;
  if (text.includes("cocktails") && searchable.includes("cocktail")) score += 50;
  if (text.includes("drinks") && searchable.includes("drink")) score += 40;
  if (text.includes("bar") && searchable.includes("bar")) score += 40;
  if (text.includes("brunch") && searchable.includes("brunch")) score += 50;
  if (text.includes("romantic") && restaurant.atmosphere?.toLowerCase().includes("cozy")) score += 15;
  if (text.includes("quiet") && restaurant.noise_level?.toLowerCase().includes("quiet")) score += 15;
  if (text.includes("not too loud") && restaurant.noise_level?.toLowerCase() !== "loud") score += 15;

  return score;
}

function scoreActivity(
  activity: any,
  input: string,
  userLocation?: { latitude: number; longitude: number } | null
) {
  const text = input.toLowerCase();
  const region = getRegion(input);
  const zipCode = extractZipCode(input);
  const searchable = locationText(activity);

  let score = 0;

  score += keywordBoost(activity, input);

  if (region && isRegionMatch(region, activity.city, activity.neighborhood)) {
    score += 35;
  }

  if (zipCode && activity.zip_code === zipCode) score += 45;

  if (userLocation && wantsNearMe(input)) {
    const distance = distanceMiles(
      userLocation.latitude,
      userLocation.longitude,
      activity.latitude,
      activity.longitude
    );

    if (distance !== null) {
      if (distance <= 3) score += 45;
      else if (distance <= 7) score += 35;
      else if (distance <= 15) score += 20;
    }
  }

  if (activity.city && text.includes(activity.city.toLowerCase())) score += 25;
  if (activity.neighborhood && text.includes(activity.neighborhood.toLowerCase())) score += 25;
  if (activity.activity_type && text.includes(activity.activity_type.toLowerCase())) score += 30;
  if (activity.atmosphere && text.includes(activity.atmosphere.toLowerCase())) score += 15;
  if (activity.price_range && text.includes(activity.price_range.toLowerCase())) score += 10;

  if (
    toArray(activity.date_style_tags).some((tag) =>
      text.includes(tag.toLowerCase())
    )
  ) {
    score += 20;
  }

  if (text.includes("museum") && activity.activity_type?.toLowerCase().includes("museum")) score += 100;
  if (text.includes("bowling") && activity.activity_type?.toLowerCase().includes("bowling")) score += 100;
  if (text.includes("axe") && activity.activity_type?.toLowerCase().includes("axe")) score += 100;
  if (text.includes("arcade") && activity.activity_type?.toLowerCase().includes("arcade")) score += 100;
  if (text.includes("karaoke") && activity.activity_type?.toLowerCase().includes("karaoke")) score += 100;
  if (text.includes("escape") && activity.activity_type?.toLowerCase().includes("escape")) score += 100;
  if (text.includes("mini golf") && activity.activity_type?.toLowerCase().includes("mini golf")) score += 100;

  if (text.includes("art") && activity.activity_type?.toLowerCase().includes("museum")) score += 25;
  if (text.includes("culture") && activity.atmosphere?.toLowerCase().includes("cultural")) score += 20;
  if (text.includes("quiet") && activity.atmosphere?.toLowerCase().includes("quiet")) score += 15;
  if (text.includes("fun") && activity.atmosphere?.toLowerCase().includes("fun")) score += 20;
  if (text.includes("group") && activity.group_friendly === true) score += 20;

  if (text.includes("wine") && searchable.includes("wine")) score += 40;
  if (text.includes("brunch") && searchable.includes("brunch")) score += 40;
  if (text.includes("cocktail") && searchable.includes("cocktail")) score += 40;

  return score;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body.messages || [];
    const input = body.input || messages[messages.length - 1]?.content || "";

    const userLocation =
      body.userLocation?.latitude && body.userLocation?.longitude
        ? {
            latitude: Number(body.userLocation.latitude),
            longitude: Number(body.userLocation.longitude),
          }
        : null;

    if (!input) {
      return Response.json({ error: "Missing input" }, { status: 400 });
    }

    const text = input.toLowerCase();
    const region = getRegion(input);
    const zipCode = extractZipCode(input);
    const nearMe = wantsNearMe(input);
    const radiusMiles = extractRadiusMiles(input);

    const cacheKey = normalizeQuery(
      `${input} ${region || ""} ${zipCode || ""} ${
        userLocation ? `${userLocation.latitude},${userLocation.longitude}` : ""
      } ${radiusMiles}`
    );

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

    const wantsDinner =
      text.includes("dinner") ||
      text.includes("restaurant") ||
      text.includes("food") ||
      text.includes("eat") ||
      text.includes("pizza") ||
      text.includes("lunch") ||
      text.includes("brunch") ||
      text.includes("wine") ||
      text.includes("cocktail") ||
      text.includes("cocktails") ||
      text.includes("drinks") ||
      text.includes("bar");

    const wantsMuseum = text.includes("museum");
    const wantsBowling = text.includes("bowling");
    const wantsAxe = text.includes("axe");
    const wantsArcade = text.includes("arcade");
    const wantsKaraoke = text.includes("karaoke");
    const wantsEscape = text.includes("escape");
    const wantsMiniGolf = text.includes("mini golf");

    const wantsSpecificActivity =
      wantsMuseum ||
      wantsBowling ||
      wantsAxe ||
      wantsArcade ||
      wantsKaraoke ||
      wantsEscape ||
      wantsMiniGolf;

    const wantsActivity =
      wantsSpecificActivity ||
      text.includes("activity") ||
      text.includes("activities");

    const wantsFullOuting =
      text.includes("date night") ||
      text.includes("night out") ||
      text.includes("outing") ||
      text.includes("plan a date") ||
      text.includes("full plan");

    const shouldReturnRestaurants =
      wantsDinner || wantsFullOuting || (!wantsDinner && !wantsActivity);

    const shouldReturnActivities = wantsActivity || wantsFullOuting;

    const { data: restaurants, error: restaurantError } = await supabase
      .from("restaurants")
      .select(`
        id,
        restaurant_name,
        address,
        city,
        state,
        zip_code,
        neighborhood,
        latitude,
        longitude,
        description,
        cuisine,
        cuisine_type,
        atmosphere,
        lighting,
        noise_level,
        price_range,
        reservation_link,
        reservation_url,
        website,
        image_url,
        rating,
        review_count,
        primary_tag,
        date_style_tags,
        search_keywords,
        best_for,
        special_features,
        signature_items,
        quality_score,
        popularity_score,
        roseout_score
      `)
      .eq("status", "approved");

    if (restaurantError) {
      return Response.json({ error: restaurantError.message }, { status: 500 });
    }

    const { data: activities, error: activityError } = await supabase
      .from("activities")
      .select(`
        id,
        activity_name,
        activity_type,
        address,
        city,
        state,
        zip_code,
        neighborhood,
        latitude,
        longitude,
        description,
        price_range,
        atmosphere,
        group_friendly,
        reservation_link,
        reservation_url,
        website,
        image_url,
        rating,
        review_count,
        primary_tag,
        date_style_tags,
        search_keywords,
        best_for,
        special_features,
        signature_items,
        quality_score,
        popularity_score,
        roseout_score
      `)
      .eq("status", "approved");

    if (activityError) {
      return Response.json({ error: activityError.message }, { status: 500 });
    }

    let filteredRestaurants = restaurants || [];
    let filteredActivities = activities || [];

    if (region) {
      filteredRestaurants = filteredRestaurants.filter((r: any) =>
        isRegionMatch(region, r.city, r.neighborhood)
      );

      filteredActivities = filteredActivities.filter((a: any) =>
        isRegionMatch(region, a.city, a.neighborhood)
      );
    }

    if (zipCode) {
      filteredRestaurants = filteredRestaurants.filter(
        (r: any) => r.zip_code === zipCode
      );

      filteredActivities = filteredActivities.filter(
        (a: any) => a.zip_code === zipCode
      );
    }

    if (nearMe && userLocation) {
      filteredRestaurants = filteredRestaurants
        .map((r: any) => ({
          ...r,
          distance_miles: distanceMiles(
            userLocation.latitude,
            userLocation.longitude,
            r.latitude,
            r.longitude
          ),
        }))
        .filter(
          (r: any) =>
            r.distance_miles !== null && r.distance_miles <= radiusMiles
        );

      filteredActivities = filteredActivities
        .map((a: any) => ({
          ...a,
          distance_miles: distanceMiles(
            userLocation.latitude,
            userLocation.longitude,
            a.latitude,
            a.longitude
          ),
        }))
        .filter(
          (a: any) =>
            a.distance_miles !== null && a.distance_miles <= radiusMiles
        );
    }

    if (wantsMuseum) {
      filteredActivities = filteredActivities.filter((a: any) =>
        a.activity_type?.toLowerCase().includes("museum")
      );
    } else if (wantsBowling) {
      filteredActivities = filteredActivities.filter((a: any) =>
        a.activity_type?.toLowerCase().includes("bowling")
      );
    } else if (wantsAxe) {
      filteredActivities = filteredActivities.filter((a: any) =>
        a.activity_type?.toLowerCase().includes("axe")
      );
    } else if (wantsArcade) {
      filteredActivities = filteredActivities.filter((a: any) =>
        a.activity_type?.toLowerCase().includes("arcade")
      );
    } else if (wantsKaraoke) {
      filteredActivities = filteredActivities.filter((a: any) =>
        a.activity_type?.toLowerCase().includes("karaoke")
      );
    } else if (wantsEscape) {
      filteredActivities = filteredActivities.filter((a: any) =>
        a.activity_type?.toLowerCase().includes("escape")
      );
    } else if (wantsMiniGolf) {
      filteredActivities = filteredActivities.filter((a: any) =>
        a.activity_type?.toLowerCase().includes("mini golf")
      );
    }

    const rankedRestaurants = (filteredRestaurants || [])
      .map((restaurant: any) => {
        const ruleScore = scoreRestaurant(restaurant, input, userLocation);
        const savedScore = restaurant.roseout_score || 0;
        const qualityScore = restaurant.quality_score || 0;
        const popularityScore = restaurant.popularity_score || 0;

        let distanceBoost = 0;

        if (
          restaurant.distance_miles !== null &&
          restaurant.distance_miles !== undefined
        ) {
          if (restaurant.distance_miles <= 3) distanceBoost = 15;
          else if (restaurant.distance_miles <= 7) distanceBoost = 10;
          else if (restaurant.distance_miles <= 15) distanceBoost = 5;
        }

        const finalScore =
          ruleScore * 0.65 +
          savedScore * 0.15 +
          qualityScore * 0.12 +
          popularityScore * 0.08 +
          distanceBoost;

        return {
          ...restaurant,
          roseout_score: Math.round(Math.min(finalScore, 100)),
        };
      })
      .filter((restaurant: any) => restaurant.roseout_score > 0)
      .sort((a: any, b: any) => {
        if (nearMe && userLocation) {
          return (a.distance_miles || 999) - (b.distance_miles || 999);
        }

        return b.roseout_score - a.roseout_score;
      });

    const rankedActivities = (filteredActivities || [])
      .map((activity: any) => {
        const ruleScore = scoreActivity(activity, input, userLocation);
        const savedScore = activity.roseout_score || 0;
        const qualityScore = activity.quality_score || 0;
        const popularityScore = activity.popularity_score || 0;

        let distanceBoost = 0;

        if (
          activity.distance_miles !== null &&
          activity.distance_miles !== undefined
        ) {
          if (activity.distance_miles <= 3) distanceBoost = 15;
          else if (activity.distance_miles <= 7) distanceBoost = 10;
          else if (activity.distance_miles <= 15) distanceBoost = 5;
        }

        const finalScore =
          ruleScore * 0.65 +
          savedScore * 0.15 +
          qualityScore * 0.12 +
          popularityScore * 0.08 +
          distanceBoost;

        return {
          ...activity,
          roseout_score: Math.round(Math.min(finalScore, 100)),
        };
      })
      .filter((activity: any) => activity.roseout_score > 0)
      .sort((a: any, b: any) => {
        if (nearMe && userLocation) {
          return (a.distance_miles || 999) - (b.distance_miles || 999);
        }

        return b.roseout_score - a.roseout_score;
      });

    const topRestaurants = shouldReturnRestaurants
      ? rankedRestaurants.slice(0, 5)
      : [];

    const topActivities = shouldReturnActivities
      ? rankedActivities.slice(0, 5)
      : [];

    const slimRestaurants = topRestaurants.map((r: any) => ({
      name: r.restaurant_name,
      city: r.city,
      neighborhood: r.neighborhood,
      cuisine: r.cuisine || r.cuisine_type,
      rating: r.rating,
      score: r.roseout_score,
      distance_miles: r.distance_miles
        ? Number(r.distance_miles.toFixed(1))
        : null,
      tag: r.primary_tag,
    }));

    const slimActivities = topActivities.map((a: any) => ({
      name: a.activity_name,
      city: a.city,
      neighborhood: a.neighborhood,
      type: a.activity_type,
      rating: a.rating,
      score: a.roseout_score,
      distance_miles: a.distance_miles
        ? Number(a.distance_miles.toFixed(1))
        : null,
      tag: a.primary_tag,
    }));

    const shortConversation = messages
      .slice(-4)
      .map((m: any) => `${m.role}: ${m.content}`)
      .join("\n");

    const isFollowUp = messages.length > 1;

    const prompt = `
You are RoseOut, a concise AI outing planner.

${isFollowUp ? "This is a follow-up. Answer only the latest user request." : ""}

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
- Do NOT add times unless asked.
- Do NOT add dessert, drinks, walks, or extra stops unless asked.
- Do NOT say “take your time,” “enjoy the meal,” or “chat.”
- Use ONLY the listed restaurants and activities.
- Do NOT invent business details.
- If dinner only, recommend restaurants only.
- If activity only, recommend activities only.
- If full outing/date night, recommend one restaurant and one activity.
- If distance_miles exists, you may mention it briefly.
`;

    const response = await openai.responses.create({
      model: AI_MODEL,
      input: prompt,
      max_output_tokens: 350,
    });

    const responsePayload = {
      reply:
        nearMe && !userLocation
          ? "To show nearby results, please allow location access or search by zip code."
          : response.output_text || "No response generated.",

      restaurants: topRestaurants.map((r: any) => ({
        id: String(r.id),
        restaurant_name: r.restaurant_name,
        address: r.address,
        city: r.city,
        state: r.state,
        zip_code: r.zip_code,
        roseout_score: r.roseout_score,
        reservation_link: r.reservation_link,
        reservation_url: r.reservation_url,
        website: r.website,
        image_url: r.image_url || null,
        rating: r.rating || null,
        review_count: r.review_count || null,
        primary_tag: r.primary_tag || null,
        date_style_tags: r.date_style_tags || [],
        distance_miles: r.distance_miles
          ? Number(r.distance_miles.toFixed(1))
          : null,
      })),

      activities: topActivities.map((a: any) => ({
        id: String(a.id),
        activity_name: a.activity_name,
        activity_type: a.activity_type,
        address: a.address,
        city: a.city,
        state: a.state,
        zip_code: a.zip_code,
        price_range: a.price_range,
        atmosphere: a.atmosphere,
        group_friendly: a.group_friendly,
        roseout_score: a.roseout_score,
        reservation_link: a.reservation_link,
        reservation_url: a.reservation_url,
        website: a.website,
        image_url: a.image_url || null,
        rating: a.rating || null,
        review_count: a.review_count || null,
        primary_tag: a.primary_tag || null,
        date_style_tags: a.date_style_tags || [],
        distance_miles: a.distance_miles
          ? Number(a.distance_miles.toFixed(1))
          : null,
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