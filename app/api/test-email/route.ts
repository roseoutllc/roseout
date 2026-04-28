import { sendEmail } from "@/lib/email";

export async function GET() {
  try {
    const result = await sendEmail({
      to: "nick@roseout.com",
      subject: "RoseOut Email Test",
      html: "<p>Resend is working.</p>",
    });

    return Response.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Email failed" },
      { status: 500 }
    );
  }
}