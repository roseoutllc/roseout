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
    const input = body.input || messages[messages.length - 1]?.content || "";

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

    const isFollowUp = messages.length > 1;

    const prompt = `
You are RoseOut, a concise AI outing planner.

${isFollowUp ? "This is a follow-up. Use the previous assistant plan as context and modify or answer only what the user asked. Do not restart the whole plan unless asked." : ""}

Conversation:
${conversation}

Latest user request:
"${input}"

Available restaurants:
${JSON.stringify(topRestaurants, null, 2)}

STRICT RULES:
- For follow-ups, answer ONLY the latest request.
- Do NOT repeat the full plan unless the user asks.
- Do NOT add times unless the user asks for timing.
- Do NOT add dessert, drinks, walks, or extra activities unless asked.
- Do NOT use filler like “take your time,” “enjoy the meal,” or “chat.”
- Use ONLY restaurants from the list.
- Do NOT invent restaurant details.
- Keep it short and direct.

Follow-up behavior:
- If user says “make it cheaper,” adjust the existing recommendation.
- If user says “make it quieter,” focus only on quieter options.
- If user asks “why this one?” explain briefly.
- If user asks “give me another option,” suggest one alternative from the list.
- If user asks “what’s the address?” give only the address.
- If user asks “is it loud?” answer only based on noise_level or say the data is not listed.

For first-time plan requests:
- Give the restaurant name.
- Give the address.
- Give one short reason it fits.
- Only include extra plan details if the user asked for them.
`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: prompt,
      max_output_tokens: 700,
    });

    return Response.json({
      reply: response.output_text || "No response generated.",
      restaurants: topRestaurants.map((r: any) => ({
        id: r.id,
        restaurant_name: r.restaurant_name,
        address: r.address,
        city: r.city,
        state: r.state,
        zip_code: r.zip_code,
        roseout_score: r.roseout_score,
        reservation_link: r.reservation_link,
        website: r.website,
        image_url: r.image_url || null,
      })),
    });
  } catch (error: any) {
    console.error("GENERATE ERROR:", error);

    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}