import { supabase } from "@/lib/supabase";
function isValidPlace(place: any, type: string) {
  // ❌ No name
  if (!place.displayName?.text) return false;

  // ❌ No rating
  if (!place.rating || place.rating < 3.8) return false;

  // ❌ Too few reviews (low quality)
  if (!place.userRatingCount || place.userRatingCount < 20) return false;

  // ❌ Missing address
  if (!place.formattedAddress) return false;

  // ❌ Exclude unwanted types
  const badTypes = [
    "gas_station",
    "convenience_store",
    "grocery_store",
    "hardware_store",
    "car_repair",
    "school",
    "hospital",
    "church",
  ];

  if (place.types?.some((t: string) => badTypes.includes(t))) {
    return false;
  }

  // 🎯 Restaurant-specific filter
  if (type === "restaurant") {
    if (!place.types?.includes("restaurant")) return false;
  }

  return true;
}
function buildTags(place: any) {
  const tags: string[] = [];
  const types = place.types || [];
  const name = place.displayName?.text?.toLowerCase() || "";

  if (place.rating >= 4.5) tags.push("Top Rated");
  if (place.rating >= 4.2) tags.push("Highly Rated");

  if (types.includes("museum") || types.includes("art_gallery")) {
    tags.push("Cultural");
  }

  if (
    types.includes("bowling_alley") ||
    types.includes("amusement_center") ||
    name.includes("axe") ||
    name.includes("escape") ||
    name.includes("arcade")
  ) {
    tags.push("Fun");
  }

  if (types.includes("bar") || types.includes("night_club") || name.includes("lounge")) {
    tags.push("Nightlife");
  }

  if (name.includes("rooftop")) tags.push("Rooftop");
  if (name.includes("romantic")) tags.push("Romantic");
  if (name.includes("luxury") || place.priceLevel === "PRICE_LEVEL_EXPENSIVE") {
    tags.push("Upscale");
  }

  if (place.priceLevel === "PRICE_LEVEL_INEXPENSIVE") {
    tags.push("Budget");
  }

  return [...new Set(tags)].slice(0, 3);
}

function getPrimaryTag(place: any) {
  const type = getActivityType(place);

  if (type === "Museum") return "Best for a Cultural Date";
  if (type === "Art Gallery") return "Best for an Artsy Date";
  if (type === "Bowling") return "Best for a Fun Night";
  if (type === "Axe Throwing") return "Best for an Adventurous Date";
  if (type === "Escape Room") return "Best for a Challenge Night";
  if (type === "Karaoke") return "Best for a Playful Night";
  if (type === "Rooftop") return "Best for a Scenic Night";
  if (type === "Lounge") return "Best for a Chill Night";
  if (type === "Comedy Club") return "Best for Laughs";
  if (type === "Park") return "Best for a Relaxed Outing";

  if (place.rating >= 4.5) return "Best for a Highly Rated Experience";

  return "Popular Local Spot";
}
function getActivityType(place: any) {
  const types = place.types || [];
  const name = place.displayName?.text?.toLowerCase() || "";

  if (types.includes("museum")) return "Museum";
  if (types.includes("art_gallery")) return "Art Gallery";
  if (types.includes("bowling_alley")) return "Bowling";
  if (types.includes("movie_theater")) return "Movie Theater";
  if (types.includes("amusement_center")) return "Arcade";
  if (types.includes("tourist_attraction")) return "Attraction";
  if (types.includes("park")) return "Park";
  if (types.includes("night_club")) return "Nightlife";
  if (types.includes("bar")) return "Lounge";
  if (types.includes("performing_arts_theater")) return "Live Show";

  if (name.includes("axe")) return "Axe Throwing";
  if (name.includes("karaoke")) return "Karaoke";
  if (name.includes("escape")) return "Escape Room";
  if (name.includes("mini golf") || name.includes("minigolf")) return "Mini Golf";
  if (name.includes("rooftop")) return "Rooftop";
  if (name.includes("comedy")) return "Comedy Club";
  if (name.includes("paint")) return "Paint & Sip";

  return "Activity";
}

function getPhotoUrl(place: any) {
  const photoName = place.photos?.[0]?.name;

  if (!photoName) return null;

  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&key=${process.env.GOOGLE_PLACES_API_KEY}`;
}
function parseAddress(formattedAddress: string) {
  const parts = formattedAddress?.split(",").map((p) => p.trim()) || [];

  const address = parts[0] || "";
  const city = parts[1] || "";

  const stateZipPart = parts.find((part) =>
    /\b[A-Z]{2}\s+\d{5}/.test(part)
  );

  const stateZipMatch = stateZipPart?.match(/\b([A-Z]{2})\s+(\d{5})/);

  return {
    address,
    city,
    state: stateZipMatch?.[1] || "NY",
    zip_code: stateZipMatch?.[2] || "",
  };
}
export async function POST(req: Request) {
    const secret = req.headers.get("x-internal-import-secret");

  if (secret !== process.env.IMPORT_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { query = "restaurants in Queens NY", type = "restaurant" } =
      await req.json();

    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types,places.websiteUri,places.googleMapsUri,places.photos",
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: 10,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data.error?.message || "Google Places request failed" },
        { status: res.status }
      );
    }

const rows = (data.places || [])
  .filter((place: any) => isValidPlace(place, type))
  .map((place: any) => {
    const parsedAddress = parseAddress(place.formattedAddress || "");

    return {
      restaurant_name:
        type === "restaurant" ? place.displayName?.text || "" : null,

      activity_name:
        type === "activity" ? place.displayName?.text || "" : null,

      activity_type: getActivityType(place),

      address: parsedAddress.address || place.formattedAddress || "",
city: parsedAddress.city,
state: parsedAddress.state,
zip_code: parsedAddress.zip_code,

      rating: place.rating || null,
      review_count: place.userRatingCount || null,

      website: place.websiteUri || place.googleMapsUri || null,
      image_url: getPhotoUrl(place),

      google_place_id: place.id,
      primary_tag: getPrimaryTag(place),
      date_style_tags: buildTags(place),

      status: "approved",
    };
  });

    const table = type === "activity" ? "activities" : "restaurants";

    const cleanRows =
      type === "activity"
        ? rows.map((r: any) => ({
            activity_name: r.activity_name,
            activity_type: r.activity_type,
            address: r.address,
            city: r.city,
            state: r.state,
            zip_code: r.zip_code,
            rating: r.rating,
            review_count: r.review_count,
            website: r.website,
            image_url: r.image_url,
            google_place_id: r.google_place_id,
            primary_tag: r.primary_tag,
            date_style_tags: r.date_style_tags,
            status: r.status,
          }))
        : rows.map((r: any) => ({
            restaurant_name: r.restaurant_name,
            address: r.address,
            city: r.city,
            state: r.state,
            zip_code: r.zip_code,
            rating: r.rating,
            review_count: r.review_count,
            website: r.website,
            image_url: r.image_url,
            google_place_id: r.google_place_id,
            primary_tag: r.primary_tag,
            date_style_tags: r.date_style_tags,
            status: r.status,
          }));

    const { error } = await supabase.from(table).upsert(cleanRows, {
  onConflict: "google_place_id",
});

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      table,
      imported: cleanRows.length,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}