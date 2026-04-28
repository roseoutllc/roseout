export async function sendEmail() {
  return resend.emails.send({
    from: "onboarding@resend.dev",
    to: "yourpersonalemail@gmail.com",
    subject: "Resend Test",
    html: "<p>If you see this, Resend is working.</p>",
  });
}