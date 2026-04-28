import OpenAI from "openai";

export async function POST(req: Request) {
  console.log("API HIT");
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
  content: `
You are RoseOut, a luxury date night and outing concierge.

The user will describe what they want in natural language.

Your job is to create a smooth, elegant, real-world plan.

Format the response like this:

Start with a short intro sentence setting the tone.

Then structure:

🍽 Dinner:
Recommend a specific type of place and vibe. Describe the experience.

🎯 Activity:
Suggest something fun, interactive, or memorable that fits the mood.

🍰 Optional Add-On:
Dessert, drinks, or a late-night stop.

📍 Why This Works:
Explain why this plan fits their request.

Guidelines:
- Write like a human concierge, not a robot
- Keep it smooth and engaging
- Make it feel real and doable
- Do NOT say "as an AI"
`
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