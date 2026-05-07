import { Resend } from "resend";
import twilio from "twilio";
import { roseOutEmail, roseOutEmailButton } from "@/lib/emailTheme";

const resend = new Resend(process.env.RESEND_API_KEY);

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

type NotifyInput = {
  toEmail?: string | null;
  toPhone?: string | null;
  subject: string;
  emailHtml?: string;
  smsBody?: string;
};

export async function sendNotification({
  toEmail,
  toPhone,
  subject,
  emailHtml,
  smsBody,
}: NotifyInput) {
  const results: {
    email?: unknown;
    sms?: unknown;
    errors: string[];
  } = {
    errors: [],
  };

  if (toEmail && emailHtml && process.env.RESEND_API_KEY) {
    try {
      const email = await resend.emails.send({
        from: process.env.EMAIL_FROM || "RoseOut <hello@roseout.com>",
        to: toEmail,
        subject,
        html: emailHtml,
      });

      results.email = email;
    } catch (error: any) {
      results.errors.push(error?.message || "Email failed");
    }
  }

  if (toPhone && smsBody && twilioClient) {
    try {
      const sms = await twilioClient.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: toPhone,
        body: `${smsBody}\n\nReply STOP to opt out. Msg & data rates may apply.`,
      });

      results.sms = sms.sid;
    } catch (error: any) {
      results.errors.push(error?.message || "SMS failed");
    }
  }

  return results;
}

export async function sendLocationClaimApproved({
  email,
  phone,
  locationName,
  signupUrl,
}: {
  email?: string | null;
  phone?: string | null;
  locationName: string;
  signupUrl?: string | null;
}) {
  return sendNotification({
    toEmail: email,
    toPhone: phone,
    subject: "Your RoseOut location claim was approved",
    emailHtml: roseOutEmail(`
      <h2>Your RoseOut location claim was approved 🎉</h2>
      <p>Your claim for <strong>${locationName}</strong> has been approved.</p>
      <p>You can now create your owner account and manage your listing.</p>
      ${signupUrl ? roseOutEmailButton("Create Owner Account", signupUrl) : ""}
    `),
    smsBody: signupUrl
      ? `RoseOut: Your claim for ${locationName} was approved. Create your owner account: ${signupUrl}`
      : `RoseOut: Your claim for ${locationName} was approved.`,
  });
}