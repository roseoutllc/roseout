import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userRequest = body.request?.trim();

    if (!userRequest) {
      return Response.json({ error: "Please enter a request." }, { status: 400 });
    }

    const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("status", "approved")
      .limit(8);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const restaurantContext = restaurants
      ?.map(
        (r) => `
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
Reservation Link: ${r.reservation_link || r.google_maps_link || ""}
Phone: ${r.phone || ""}
Website: ${r.website || ""}
Instagram: ${r.instagram_url || ""}
TikTok: ${r.tiktok_url || ""}
X: ${r.x_url || ""}
`
      )
      .join("\n");

    const fallbackLinks = {
      dinner: `https://www.opentable.com/s/?term=${encodeURIComponent(userRequest)}`,
      activity: `https://www.eventbrite.com/d/online/search/?q=${encodeURIComponent(userRequest)}`,
      dessert: `https://www.google.com/maps/search/${encodeURIComponent(userRequest + " dessert drinks")}`,
    };

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are RoseOut, a luxury AI date night and outing concierge.

Use the approved restaurant data when it fits the user's request.
Recommend the best matching restaurant based on city, mood, lighting, noise level, atmosphere, cuisine, price, and best_for.

Do not invent restaurant names.
If no restaurant fits, suggest a general dinner vibe.

Format response:

🌹 RoseOut Plan:
Short elegant intro.

🍽 Dinner:
Recommend the best matching real restaurant if available. Explain why it fits.

🎯 Activity:
Suggest a matching activity.

🍰 Optional Add-On:
Suggest dessert, drinks, or a final stop.

📍 Why This Works:
Explain why the plan matches the request.

Do not include raw URLs in the written plan.
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

    const selectedRestaurant = restaurants?.[0];

    return Response.json({
      plan: response.choices[0].message.content,
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
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}