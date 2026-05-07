import { roseOutEmail, roseOutEmailCard } from "@/lib/emailTheme";
import { sendNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value || "").trim();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Server error";
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

    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;

    if (adminEmail) {
      await sendNotification({
        toEmail: adminEmail,
        subject: `New RoseOut contact message: ${topic || "General"}`,
        emailHtml: roseOutEmail(`
          <h2>New RoseOut Contact Message</h2>
          ${roseOutEmailCard(`
            <p style="margin:0 0 8px;"><strong>Name:</strong> ${name}</p>
            <p style="margin:0 0 8px;"><strong>Email:</strong> ${email}</p>
            <p style="margin:0;"><strong>Topic:</strong> ${topic || "General"}</p>
          `)}
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br />")}</p>
        `),
      });
    }

    return Response.json({
      success: true,
      message: "Message sent. We’ll get back to you shortly.",
    });
  } catch (error: unknown) {
    return Response.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}