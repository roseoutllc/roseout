import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userRequest = body.request || "";

    // Encode user input for safe URLs
    const encodedRequest = encodeURIComponent(userRequest);

    // Dynamic booking links based on user request
    const bookingLinks = `
Dinner Reservations: https://www.opentable.com/s/?term=${encodedRequest}
Activities & Events: https://www.eventbrite.com/d/online/search/?q=${encodedRequest}
Dessert or Drinks Nearby: https://www.google.com/maps/search/${encodedRequest}
`;

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

Create a smooth, engaging, real-world plan.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

🌹 RoseOut Plan:
Start with a short, elegant intro sentence setting the tone.

🍽 Dinner:
Describe a great dinner experience (vibe, type of place).

🎯 Activity:
Suggest something fun, interactive, or memorable.

🍰 Optional Add-On:
Dessert, drinks, or a late-night stop.

🔗 Booking Links:
Use the exact links provided by the system.

📍 Why This Works:
Explain why this plan fits the user’s request.

GUIDELINES:
- Write like a human concierge
- Keep it natural and smooth
- Make it feel realistic and local
- DO NOT say "as an AI"
- DO NOT invent fake links
          `,
        },
        {
          role: "user",
          content: `
User request:
${userRequest}

Use these booking links:
${bookingLinks}
          `,
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