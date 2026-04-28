import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = body.input;

    if (!input) {
      return Response.json(
        { error: "Missing input" },
        { status: 400 }
      );
    }

    // 🔥 1. Get approved restaurants
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

    // 🔥 2. Smart filtering
    const lowerInput = input.toLowerCase();

    const filtered = restaurants?.filter((r: any) => {
      return (
        r.city?.toLowerCase().includes(lowerInput) ||
        r.cuisine_type?.toLowerCase().includes(lowerInput) ||
        r.atmosphere?.toLowerCase().includes(lowerInput) ||
        r.neighborhood?.toLowerCase().includes(lowerInput)
      );
    });

    const finalRestaurants =
      filtered && filtered.length > 0 ? filtered : restaurants;

    // 🔥 3. Build prompt
    const prompt = `
You are an AI that creates personalized outing and date plans.

Use ONLY the restaurants provided below.

Restaurants:
${JSON.stringify(finalRestaurants)}

User request:
${input}

Create a plan using real restaurants. Include:
- Restaurant name
- Address
- Why it's a good fit
- Suggested timing
- Keep it natural and conversational
`;

    // 🔥 4. OpenAI call
    const response = await openai.responses.create({
      model: "gpt-5.3",
      input: prompt,
    });

    const output =
      response.output_text || "No response generated.";

    return Response.json({
      result: output,
    });
  } catch (error: any) {
    console.error("GENERATE ERROR:", error);

    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}