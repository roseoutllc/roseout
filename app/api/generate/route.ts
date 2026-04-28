import OpenAI from "openai";

export async function POST(req: Request) {
  const body = await req.json();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are RoseOut, a premium AI date night and outing planner. The user will type their request in real sentences. Understand their location, budget, mood, time, occasion, and preferences. Respond in smooth, natural, complete sentences. Include dinner, an activity, an optional add-on, and booking suggestions when possible.",
      },
      {
        role: "user",
        content: body.request,
      },
    ],
  });

  return Response.json({
    plan: response.choices[0].message.content,
  });
}