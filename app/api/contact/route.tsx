import { createSupportTicket } from "@/lib/support";

export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value || "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = clean(body.name);
    const email = clean(body.email).toLowerCase();
    const topic = clean(body.topic);
    const message = clean(body.message);
    const captchaToken = clean(body.captchaToken);

    if (!name || !email || !message) {
      return Response.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    if (!captchaToken) {
      return Response.json(
        { error: "Please complete the captcha." },
        { status: 400 }
      );
    }

    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY || "",
          response: captchaToken,
        }),
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      return Response.json(
        { error: "Captcha verification failed." },
        { status: 400 }
      );
    }

    const ticket = await createSupportTicket({
      name,
      email,
      topic: topic || "Contact Form",
      subject: `Contact form: ${topic || "General"}`,
      message,
      source: "contact_form",
    });

    return Response.json({
      success: true,
      ticketId: ticket.id,
      ticketUrl: `/support/tickets/${ticket.id}?key=${ticket.public_access_token}`,
      message: "Support ticket created. We’ll get back to you shortly.",
    });
  } catch (error: unknown) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}