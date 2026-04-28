import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const userRequest = body.request?.trim();

    // Validate input
    if (!userRequest) {
      return Response.json(
        { error: "Please enter a request." },
        { status: 400 }
      );
    }

    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    // Encode request for URLs
    const encoded = encodeURIComponent(userRequest);

    // Booking links (sent separately for buttons)
    const links = {
      dinner: `https://www.opentable.com/s/?term=${encoded}`,
      activity: `https://www.eventbrite.com/d/online/search/?q=${encoded}`,
      dessert: `https://www.google.com/maps/search/${encoded}`,
    };

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Generate AI response
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are RoseOut, a luxury date night and outing concierge.

The user will describe what they want in natural language.

Create a smooth, engaging, real-world plan.

FORMAT YOUR RESPONSE LIKE THIS:

🌹 RoseOut Plan:
Start with a short, elegant intro sentence.

🍽 Dinner:
Describe a great dinner experience (vibe, type of place).

🎯 Activity:
Suggest something fun, interactive, or memorable.

🍰 Optional Add-On:
Dessert, drinks, or a late-night stop.

📍 Why This Works:
Explain why this plan fits the user’s request.

GUIDELINES:
- Write like a human concierge
- Keep it natural and smooth
- Make it feel realistic and local
- DO NOT include booking links
- DO NOT say "as an AI"
          `,
        },
        {
          role: "user",
          content: userRequest,
        },
      ],
    });

    const plan = response.choices[0]?.message?.content || "No plan generated.";

    // Return response
    return Response.json({
      plan,
      links,
    });
  } catch (error: any) {
    console.error("API ERROR:", error);

    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}