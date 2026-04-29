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

  return score;
}

function scoreActivity(activity: any, input: string) {
  const text = input.toLowerCase();
  let score = 0;

  if (activity.city && text.includes(activity.city.toLowerCase())) score += 25;
  if (activity.activity_type && text.includes(activity.activity_type.toLowerCase())) score += 30;
  if (activity.atmosphere && text.includes(activity.atmosphere.toLowerCase())) score += 15;
  if (activity.price_range && text.includes(activity.price_range.toLowerCase())) score += 10;

  if (text.includes("bowling") && activity.activity_type?.toLowerCase().includes("bowling")) score += 35;
  if (text.includes("axe") && activity.activity_type?.toLowerCase().includes("axe")) score += 35;
  if (text.includes("arcade") && activity.activity_type?.toLowerCase().includes("arcade")) score += 35;
  if (text.includes("karaoke") && activity.activity_type?.toLowerCase().includes("karaoke")) score += 35;
  if (text.includes("escape") && activity.activity_type?.toLowerCase().includes("escape")) score += 35;
  if (text.includes("fun") && activity.atmosphere?.toLowerCase().includes("fun")) score += 20;
  if (text.includes("group") && activity.group_friendly === true) score += 20;

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

    const { data: restaurants, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*")
      .eq("status", "approved");

    if (restaurantError) {
      return Response.json(
        { error: restaurantError.message },
        { status: 500 }
      );
    }

    const { data: activities, error: activityError } = await supabase
      .from("activities")
      .select("*")
      .eq("status", "approved");

    if (activityError) {
      return Response.json(
        { error: activityError.message },
        { status: 500 }
      );
    }

    const rankedRestaurants = (restaurants || [])
      .map((restaurant: any) => ({
        ...restaurant,
        roseout_score: scoreRestaurant(restaurant, input),
      }))
      .sort((a: any, b: any) => b.roseout_score - a.roseout_score);

    const rankedActivities = (activities || [])
      .map((activity: any) => ({
        ...activity,
        roseout_score: scoreActivity(activity, input),
      }))
      .sort((a: any, b: any) => b.roseout_score - a.roseout_score);

    const topRestaurants = rankedRestaurants.slice(0, 5);
    const topActivities = rankedActivities.slice(0, 5);

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

Available activities:
${JSON.stringify(topActivities, null, 2)}

STRICT RULES:
- For follow-ups, answer ONLY the latest request.
- Do NOT repeat the full plan unless the user asks.
- Do NOT add times unless the user asks for timing.
- Do NOT add dessert, drinks, walks, or extra stops unless asked.
- Do NOT use filler like “take your time,” “enjoy the meal,” or “chat.”
- Use ONLY restaurants and activities from the lists.
- Do NOT invent business details.
- Keep it short and direct.
- If the user asks for dinner only, recommend restaurants only.
- If the user asks for an activity only, recommend activities only.
- If the user asks for a full outing/date night, recommend one restaurant and one activity.

Follow-up behavior:
- If user says “make it cheaper,” adjust the existing recommendation.
- If user says “make it more fun,” focus on activities.
- If user says “make it quieter,” focus on quieter options.
- If user asks “why this one?” explain briefly.
- If user asks “give me another option,” suggest one alternative from the list.
- If user asks “what’s the address?” give only the address.
`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: prompt,
      max_output_tokens: 700,
    });

    return Response.json({
      reply: response.output_text || "No response generated.",

      restaurants: topRestaurants.map((r: any) => ({
        id: String(r.id),
        restaurant_name: r.restaurant_name,
        address: r.address,
        city: r.city,
        state: r.state,
        zip_code: r.zip_code,
        roseout_score: r.roseout_score,
        reservation_link: r.reservation_link,
        website: r.website,
        image_url: r.image_url || null,
        date_style_tags: r.date_style_tags || [],
        primary_tag: r.primary_tag || null,

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
        website: a.website,
        image_url: a.image_url || null,
        date_style_tags: a.date_style_tags || [],
        primary_tag: a.primary_tag || null,

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