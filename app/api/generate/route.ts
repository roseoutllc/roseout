import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    if (!body.request) {
      return Response.json(
        { error: "Missing request text" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are RoseOut, a premium AI date night and outing planner. Respond in smooth, natural sentences.",
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
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}