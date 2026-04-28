import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
console.log("RESEND KEY:", process.env.RESEND_API_KEY);
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: "RoseOut.com <hello@roseout.com>",
    to,
    subject,
    html,
  });
}