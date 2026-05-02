import { NextRequest, NextResponse } from "next/server";
import { sendNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      toEmail,
      toPhone,
      subject,
      emailHtml,
      smsBody,
      secret,
    } = body;

    if (secret !== process.env.NOTIFICATION_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!subject) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }

    const result = await sendNotification({
      toEmail,
      toPhone,
      subject,
      emailHtml,
      smsBody,
    });

    return NextResponse.json({
      success: result.errors.length === 0,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Notification failed" },
      { status: 500 }
    );
  }
}