import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function scoreRestaurant(restaurant: any, input: string) {
  const text = input.toLowerCase();
  let score = 0;

  const fields = {
    city: restaurant.city,
    neighborhood: restaurant.neighborhood,
    cuisine: restaurant.cuisine_type,
    atmosphere: restaurant.atmosphere,
    lighting: restaurant.lighting,
    noise: restaurant.noise_level,
    price: restaurant.price_range,
    description: restaurant.description,
  };

  if (fields.city && text.includes(fields.city.toLowerCase())) score += 25;
  if (fields.neighborhood && text.includes(fields.neighborhood.toLowerCase())) score += 25;
  if (fields.cuisine && text.includes(fields.cuisine.toLowerCase())) score += 15;
  if (fields.atmosphere && text.includes(fields.atmosphere.toLowerCase())) score += 15;
  if (fields.lighting && text.includes(fields.lighting.toLowerCase())) score += 10;
  if (fields.noise && text.includes(fields.noise.toLowerCase())) score += 10;
  if (fields.price && text.includes(fields.price.toLowerCase())) score += 10;

  restaurant.mood_tags?.forEach((tag: string) => {
    if (text.includes(tag.toLowerCase())) score += 12;
  });

  restaurant.best_for?.forEach((tag: string) => {
    if (text.includes(tag.toLowerCase())) score += 12;
  });

  if (text.includes("romantic") && restaurant.atmosphere?.toLowerCase().includes("cozy")) score += 10;
  if (text.includes("quiet") && restaurant.noise_level?.toLowerCase().includes("quiet")) score += 15;
  if (text.includes("not too loud") && restaurant.noise_level?.toLowerCase() !== "loud") score += 15;
  if (text.includes("fun") && restaurant.atmosphere?.toLowerCase().includes("lively")) score += 10;
  if (text.includes("first date") && restaurant.best_for?.includes("first date")) score += 15;

  return score;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = body.input || body.request;

    if (!input) {
      return Response.json(
        { error: "Missing input" },
        { status: 400 }
      );
    }

    const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("status", "approved");

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const rankedRestaurants = (restaurants || [])
      .map((restaurant: any) => ({
        ...restaurant,
        roseout_score: scoreRestaurant(restaurant, input),
      }))
      .sort((a: any, b: any) => b.roseout_score - a.roseout_score);

    const topRestaurants = rankedRestaurants.slice(0, 5);

    const prompt = `
You are RoseOut, a luxury AI date night and outing concierge.

The user typed:
"${input}"

Use ONLY the ranked restaurants below.

Restaurants are already scored by RoseOut. Higher score means better match.

Ranked restaurants:
${JSON.stringify(topRestaurants, null, 2)}

Create a premium, natural-sounding outing plan.

Include:
🌹 RoseOut Plan:
A short elegant intro.

🍽 Dinner:
Recommend the best matching restaurant by name. Mention why it fits.

🎯 Activity:
Suggest an activity that matches the vibe.

🍰 Optional Add-On:
Suggest dessert, drinks, or a final stop.

📍 Why This Works:
Explain why the plan matches the user’s request.

Do not invent restaurant names.
Do not include raw URLs.
`;

    const response = await openai.responses.create({
      model: "gpt-5.3",
      input: prompt,
    });

    const selectedRestaurant = topRestaurants[0] || null;

    return Response.json({
      result: response.output_text || "No response generated.",
      selectedRestaurant,
      rankedRestaurants: topRestaurants,
      links: {
        dinner:
          selectedRestaurant?.reservation_link ||
          selectedRestaurant?.google_maps_link ||
          null,
        maps: selectedRestaurant
          ? `https://www.google.com/maps/search/${encodeURIComponent(
              `${selectedRestaurant.address || ""} ${selectedRestaurant.city || ""} ${selectedRestaurant.state || ""} ${selectedRestaurant.zip_code || ""}`
            )}`
          : null,
        website: selectedRestaurant?.website || null,
        phone: selectedRestaurant?.phone || null,
        instagram: selectedRestaurant?.instagram_url || null,
        tiktok: selectedRestaurant?.tiktok_url || null,
        x: selectedRestaurant?.x_url || null,
      },
    });
  } catch (error: any) {
    console.error("GENERATE ERROR:", error);

    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}