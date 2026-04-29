import { supabase } from "@/lib/supabase";

function buildTags(place: any) {
  const tags: string[] = [];

  if (place.rating >= 4.5) tags.push("Highly Rated");
  if (place.priceLevel === "PRICE_LEVEL_INEXPENSIVE") tags.push("Budget");
  if (
    place.priceLevel === "PRICE_LEVEL_EXPENSIVE" ||
    place.priceLevel === "PRICE_LEVEL_VERY_EXPENSIVE"
  ) {
    tags.push("Upscale");
  }

  if (place.types?.includes("museum")) tags.push("Cultural");
  if (place.types?.includes("bowling_alley")) tags.push("Fun");
  if (place.types?.includes("restaurant")) tags.push("Dinner");

  return tags.slice(0, 3);
}

function getPrimaryTag(place: any) {
  if (place.types?.includes("museum")) return "Best for a Cultural Date";
  if (place.types?.includes("bowling_alley")) return "Best for a Fun Night";
  if (place.rating >= 4.5) return "Best for a Highly Rated Experience";

  return "Popular Local Spot";
}

function getPhotoUrl(place: any) {
  const photoName = place.photos?.[0]?.name;

  if (!photoName) return null;

  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&key=${process.env.GOOGLE_PLACES_API_KEY}`;
}

export async function POST(req: Request) {
  try {
    const { query = "restaurants in Queens NY", type = "restaurant" } =
      await req.json();

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
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
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data.error?.message || "Google Places request failed" },
        { status: res.status }
      );
    }

    const rows = (data.places || []).map((place: any) => {
      const addressParts = place.formattedAddress?.split(",") || [];

      return {
        restaurant_name:
          type === "restaurant" ? place.displayName?.text || "" : null,
        activity_name:
          type === "activity" ? place.displayName?.text || "" : null,

        address: addressParts[0]?.trim() || place.formattedAddress || "",
        city: addressParts[1]?.trim() || "",
        state: "NY",
        zip_code: "",

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
            activity_type: place.types?.includes("museum")
  ? "Museum"
  : place.types?.includes("bowling_alley")
  ? "Bowling"
  : place.types?.includes("amusement_center")
  ? "Arcade"
  : "Activity",
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

    const { error } = await supabase.from(table).insert(cleanRows);

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