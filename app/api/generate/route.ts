import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function scoreRestaurant(restaurant: any, input: string) {
  const text = input.toLowerCase();
  let score = 0;

  if (restaurant.city && text.includes(restaurant.city.toLowerCase())) score += 25;
  if (restaurant.neighborhood && text.includes(restaurant.neighborhood.toLowerCase())) score += 25;
  if (restaurant.cuisine_type && text.includes(restaurant.cuisine_type.toLowerCase())) score += 15;
  if (restaurant.atmosphere && text.includes(restaurant.atmosphere.toLowerCase())) score += 15;
  if (restaurant.lighting && text.includes(restaurant.lighting.toLowerCase())) score += 10;
  if (restaurant.noise_level && text.includes(restaurant.noise_level.toLowerCase())) score += 10;
  if (restaurant.price_range && text.includes(restaurant.price_range.toLowerCase())) score += 10;

  if (text.includes("pizza") && restaurant.cuisine_type?.toLowerCase().includes("pizza")) score += 25;
  if (text.includes("romantic") && restaurant.atmosphere?.toLowerCase().includes("cozy")) score += 15;
  if (text.includes("quiet") && restaurant.noise_level?.toLowerCase().includes("quiet")) score += 15;
  if (text.includes("not too loud") && restaurant.noise_level?.toLowerCase() !== "loud") score += 15;

  const now = new Date();

  const isCurrentlyFeatured =
    restaurant.is_featured === true &&
    (!restaurant.featured_until || new Date(restaurant.featured_until) > now);

  if (isCurrentlyFeatured) {
    score += restaurant.featured_weight || 20;
  }

  return score;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body.messages || [];
    const input =
      body.input || messages[messages.length - 1]?.content || "";

    if (!input) {
      return Response.json({ error: "Missing input" }, { status: 400 });
    }

    const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("status", "approved");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const rankedRestaurants = (restaurants || [])
      .map((restaurant: any) => ({
        ...restaurant,
        roseout_score: scoreRestaurant(restaurant, input),
      }))
      .sort((a: any, b: any) => b.roseout_score - a.roseout_score);

    const topRestaurants = rankedRestaurants.slice(0, 5);

    const conversation = messages
      .map((m: any) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = `
You are RoseOut, a concise AI date and outing planner.

Conversation so far:
${conversation}

Latest user request:
"${input}"

Use ONLY these approved restaurants:
${JSON.stringify(topRestaurants, null, 2)}

Rules:
- Keep replies short and helpful.
- If this is the first request, create a simple plan.
- If this is a follow-up question, answer based on the previous plan and restaurant options.
- Use only restaurants from the provided list.
- Do not invent restaurant names, addresses, websites, or booking links.
- Mention the restaurant name and address when recommending dinner.
- If the user says "not too loud", avoid loud places.
- If the user says "romantic", prioritize cozy, dim, intimate, upscale, or warm atmosphere.
- Keep the first plan under 250 words. Follow-up answers can be shorter.

Format when creating a plan:

🌹 RoseOut Pick
[1 short intro]

🍽 Dinner
[Restaurant name] — [address]
[1 sentence why it fits]

🕒 Plan
[2–3 short timeline lines]

🎯 Add-On
[1 short activity idea]

For follow-up questions, answer naturally and directly.
`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: prompt,
      max_output_tokens: 700,
    });

    return Response.json({
      result: response.output_text || "No response generated.",
      rankedRestaurants: topRestaurants,
    });
  } catch (error: any) {
    console.error("GENERATE ERROR:", error);

    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}