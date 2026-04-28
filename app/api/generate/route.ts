import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userRequest = body.request?.trim();

    if (!userRequest) {
      return Response.json(
        { error: "Please enter a request." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("status", "approved")
      .limit(12);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const restaurantContext =
      restaurants
        ?.map(
          (r) => `
ID: ${r.id}
Restaurant: ${r.restaurant_name}
City: ${r.city}, ${r.state}
Cuisine: ${r.cuisine_type}
Price: ${r.price_range}
Description: ${r.description}
Mood Tags: ${r.mood_tags?.join(", ") || ""}
Lighting: ${r.lighting || ""}
Noise Level: ${r.noise_level || ""}
Atmosphere: ${r.atmosphere || ""}
Best For: ${r.best_for?.join(", ") || ""}
Reservation Link: ${r.reservation_link || ""}
Google Maps: ${r.google_maps_link || ""}
Website: ${r.website || ""}
Phone: ${r.phone || ""}
Instagram: ${r.instagram_url || ""}
TikTok: ${r.tiktok_url || ""}
X: ${r.x_url || ""}
`
        )
        .join("\n") || "No approved restaurants available.";

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are RoseOut, a luxury AI date night and outing concierge.

Use the approved restaurant data when it fits the user's request.
Pick the best matching restaurant based on city, mood, lighting, noise level, atmosphere, cuisine, price, and best_for.

Do not invent restaurant names.
If no restaurant fits, use selectedRestaurantId as null.

Return ONLY valid JSON in this exact structure:

{
  "selectedRestaurantId": "restaurant id or null",
  "plan": "formatted customer-facing plan"
}

The plan should be natural, premium, and formatted like:

🌹 RoseOut Plan:
Short elegant intro.

🍽 Dinner:
Recommend the selected real restaurant if available and explain why it fits. If none fits, suggest a general dinner vibe.

🎯 Activity:
Suggest a matching activity.

🍰 Optional Add-On:
Suggest dessert, drinks, or a final stop.

📍 Why This Works:
Explain why the plan matches the request.

Do not include raw URLs in the plan.
Do not say "as an AI".
          `,
        },
        {
          role: "user",
          content: `
User request:
${userRequest}

Approved restaurants:
${restaurantContext}
          `,
        },
      ],
    });

    const content = aiResponse.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    const selectedRestaurant =
      restaurants?.find((r) => r.id === parsed.selectedRestaurantId) || null;

    const encoded = encodeURIComponent(userRequest);

    const fallbackLinks = {
      dinner: `https://www.opentable.com/s/?term=${encoded}`,
      activity: `https://www.eventbrite.com/d/online/search/?q=${encoded}`,
      dessert: `https://www.google.com/maps/search/${encoded}+dessert+drinks`,
    };

    return Response.json({
      plan: parsed.plan || "No plan generated.",
      selectedRestaurant,
      links: {
        dinner:
          selectedRestaurant?.reservation_link ||
          selectedRestaurant?.google_maps_link ||
          fallbackLinks.dinner,
        activity: fallbackLinks.activity,
        dessert: fallbackLinks.dessert,
        website: selectedRestaurant?.website || null,
        phone: selectedRestaurant?.phone || null,
        instagram: selectedRestaurant?.instagram_url || null,
        tiktok: selectedRestaurant?.tiktok_url || null,
        x: selectedRestaurant?.x_url || null,
      },
    });
  } catch (error: any) {
    console.error("API ERROR:", error);

    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}