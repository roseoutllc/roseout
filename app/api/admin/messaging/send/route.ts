import { createClient } from "@supabase/supabase-js";
import { requireAdminApiRole } from "@/lib/admin-api-auth";
import { sendNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

type Channel = "email" | "sms" | "both";
type RecipientKind = "user" | "location" | "manual";
type LocationType = "restaurants" | "activities";

type ResolvedRecipient = {
  name: string;
  email: string | null;
  phone: string | null;
  smsOptIn: boolean;
};

type UserRecipientRow = {
  email: string | null;
  full_name: string | null;
  phone: string | null;
  sms_opt_in: boolean | null;
};

type LocationRecipientRow = {
  restaurant_name?: string | null;
  activity_name?: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  phone: string | null;
};

type RecipientInput = {
  kind: RecipientKind;
  id?: string;
  locationType?: LocationType;
  email?: string;
  phone?: string;
  name?: string;
};

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plainTextToHtml(message: string) {
  return escapeHtml(message)
    .split(/\r?\n/)
    .map((line) => (line ? `<p>${line}</p>` : "<br />"))
    .join("");
}

function normalizeChannel(value: string): Channel {
  if (value === "sms" || value === "both") return value;
  return "email";
}

async function resolveRecipient(input: RecipientInput): Promise<ResolvedRecipient> {
  const supabase = adminSupabase();

  if (input.kind === "manual") {
    return {
      name: clean(input.name) || "Manual recipient",
      email: clean(input.email) || null,
      phone: clean(input.phone) || null,
      smsOptIn: false,
    };
  }

  if (!input.id) {
    throw new Error("Select a recipient or enter manual contact details.");
  }

  if (input.kind === "user") {
    const { data, error } = await supabase
      .from("users")
      .select("email,full_name,phone,sms_opt_in")
      .eq("id", input.id)
      .maybeSingle<UserRecipientRow>();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("User recipient was not found.");

    return {
      name: data.full_name || data.email || "RoseOut user",
      email: data.email || null,
      phone: data.phone || null,
      smsOptIn: Boolean(data.sms_opt_in),
    };
  }

  if (input.kind === "location") {
    if (input.locationType !== "restaurants" && input.locationType !== "activities") {
      throw new Error("Select a valid location recipient.");
    }

    const nameColumn =
      input.locationType === "restaurants" ? "restaurant_name" : "activity_name";

    const { data, error } = await supabase
      .from(input.locationType)
      .select(`${nameColumn},owner_email,owner_phone,phone`)
      .eq("id", input.id)
      .maybeSingle<LocationRecipientRow>();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Location recipient was not found.");

    return {
      name: data[nameColumn] || "RoseOut location",
      email: data.owner_email || null,
      phone: data.owner_phone || data.phone || null,
      smsOptIn: true,
    };
  }

  throw new Error("Select a valid recipient.");
}

export async function POST(req: Request) {
  const { error, adminUser } = await requireAdminApiRole([
    "superuser",
    "admin",
    "editor",
  ]);

  if (error) return error;

  try {
    const body = await req.json();
    const channel = normalizeChannel(clean(body.channel));
    const subject = clean(body.subject);
    const emailBody = clean(body.emailBody);
    const smsBody = clean(body.smsBody);
    const template = clean(body.template);
    const allowUserSmsWithoutOptIn = Boolean(body.allowUserSmsWithoutOptIn);
    const recipientInput = body.recipient as RecipientInput | undefined;

    if (!recipientInput) {
      return Response.json({ error: "Recipient is required." }, { status: 400 });
    }

    if ((channel === "email" || channel === "both") && !subject) {
      return Response.json({ error: "Email subject is required." }, { status: 400 });
    }

    if ((channel === "email" || channel === "both") && !emailBody) {
      return Response.json({ error: "Email body is required." }, { status: 400 });
    }

    if ((channel === "sms" || channel === "both") && !smsBody) {
      return Response.json({ error: "Text message body is required." }, { status: 400 });
    }

    if (smsBody.length > 480) {
      return Response.json(
        { error: "Text message must be 480 characters or fewer." },
        { status: 400 }
      );
    }

    const recipient = await resolveRecipient(recipientInput);
    const wantsEmail = channel === "email" || channel === "both";
    const wantsSms = channel === "sms" || channel === "both";
    const userSmsBlocked =
      recipientInput.kind === "user" &&
      wantsSms &&
      !recipient.smsOptIn &&
      !allowUserSmsWithoutOptIn;

    if (wantsEmail && !recipient.email) {
      return Response.json(
        { error: "Selected recipient does not have an email address." },
        { status: 400 }
      );
    }

    if (wantsSms && !recipient.phone) {
      return Response.json(
        { error: "Selected recipient does not have a phone number." },
        { status: 400 }
      );
    }

    if (userSmsBlocked) {
      return Response.json(
        {
          error:
            "This user has not opted in to SMS. Use email or explicitly confirm this is a non-marketing support text.",
        },
        { status: 400 }
      );
    }

    const result = await sendNotification({
      toEmail: wantsEmail ? recipient.email : null,
      toPhone: wantsSms ? recipient.phone : null,
      subject: subject || "RoseOut update",
      emailHtml: wantsEmail
        ? `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:640px;margin:0 auto;padding:24px;">
            <p style="margin:0 0 16px;color:#e11d48;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px;">RoseOut</p>
            ${plainTextToHtml(emailBody)}
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#777;font-size:12px;margin:0;">Sent by the RoseOut admin team.</p>
          </div>
        `
        : undefined,
      smsBody: wantsSms ? smsBody : undefined,
    });

    const channelResults = {
      email: wantsEmail
        ? process.env.RESEND_API_KEY
          ? "attempted"
          : "skipped: RESEND_API_KEY is not configured"
        : "not requested",
      sms: wantsSms
        ? process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_PHONE_NUMBER
          ? "attempted"
          : "skipped: Twilio environment variables are not configured"
        : "not requested",
    };

    await adminSupabase().from("admin_message_log").insert({
      recipient_kind: recipientInput.kind,
      recipient_id: recipientInput.id || null,
      recipient_name: recipient.name,
      recipient_email: wantsEmail ? recipient.email : null,
      recipient_phone: wantsSms ? recipient.phone : null,
      channel,
      subject: subject || null,
      email_body: wantsEmail ? emailBody : null,
      sms_body: wantsSms ? smsBody : null,
      template_key: template || null,
      sent_by: adminUser?.email || null,
      provider_result: { ...result, channelResults },
    });

    return Response.json({
      success: result.errors.length === 0,
      result,
      channelResults,
      recipient: {
        name: recipient.name,
        email: wantsEmail ? recipient.email : null,
        phone: wantsSms ? recipient.phone : null,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not send message.";

    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
