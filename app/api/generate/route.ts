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
You are RoseOut, an AI outing planner.

Conversation:
${conversation}

User request:
"${input}"

Available restaurants:
${JSON.stringify(topRestaurants, null, 2)}

STRICT RULES:
- Only answer what the user asked.
- Do NOT add extra sections, ideas, or suggestions unless explicitly requested.
- Do NOT expand beyond the scope of the request.
- Do NOT include “add-ons”, “dessert”, or “after dinner” unless asked.
- Use ONLY restaurants from the list.
- Do NOT invent restaurant details.
- Keep response focused, relevant, and concise.

Behavior:
- If user asks for a plan → give a simple plan.
- If user asks a follow-up → answer ONLY that question.
- If user asks for one thing → return ONE answer, not multiple options.

Format rules:
- Keep under 150 words unless user asks for more detail.
- Use simple structure (no extra sections unless needed).

Examples:
- If user says: "plan a pizza date"
→ give ONLY the plan

- If user says: "make it cheaper"
→ modify previous plan ONLY

- If user says: "is it quiet?"
→ answer ONLY that question

Now respond.
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