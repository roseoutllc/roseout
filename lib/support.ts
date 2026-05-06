import crypto from "crypto";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/notifications";

export type SupportActor = "creator" | "admin" | "system";

export type SupportTicket = {
  id: string;
  ticket_number: string | null;
  subject: string;
  topic: string | null;
  status: string | null;
  priority: string | null;
  requester_name: string | null;
  requester_email: string;
  requester_phone: string | null;
  source: string | null;
  public_access_token: string;
  created_at: string;
  updated_at: string | null;
  last_message_at: string | null;
};

export type SupportMessage = {
  id: string;
  ticket_id: string;
  actor_type: SupportActor | string;
  author_name: string | null;
  author_email: string | null;
  author_phone: string | null;
  body: string;
  created_at: string;
};

export type CreateSupportTicketInput = {
  name: string;
  email: string;
  phone?: string;
  topic?: string;
  subject?: string;
  message: string;
  source?: string;
};

export type CreateSupportReplyInput = {
  ticketId: string;
  token?: string;
  actorType?: SupportActor;
  authorName?: string;
  authorEmail?: string;
  authorPhone?: string;
  message: string;
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function htmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function nl2br(value: string) {
  return htmlEscape(value).replace(/\n/g, "<br />");
}

export function getSupportSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000"
  );
}

export function makeTicketUrl(ticket: Pick<SupportTicket, "id" | "public_access_token">) {
  return `${getSupportSiteUrl()}/support/tickets/${ticket.id}?key=${ticket.public_access_token}`;
}

export function makeAdminTicketUrl(ticketId: string) {
  return `${getSupportSiteUrl()}/admin/dashboard/support/${ticketId}`;
}

export function makeSupportReplyAddress(ticket: Pick<SupportTicket, "id" | "public_access_token">) {
  const domain = process.env.SUPPORT_REPLY_EMAIL_DOMAIN;
  if (!domain) return process.env.SUPPORT_REPLY_TO_EMAIL || process.env.EMAIL_FROM;

  return `support+${ticket.id}.${ticket.public_access_token}@${domain}`;
}

export async function isSupportRequestAdmin() {
  const requestHeaders = await headers();
  const adminSecret = process.env.SUPPORT_INBOUND_SECRET;
  const providedSecret = requestHeaders.get("x-support-secret");

  if (adminSecret && providedSecret === adminSecret) {
    return true;
  }

  const auth = requestHeaders.get("authorization") || "";
  if (adminSecret && auth === `Bearer ${adminSecret}`) {
    return true;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return false;
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  return Boolean(adminUser);
}

export async function getSupportTicket(ticketId: string) {
  const { data, error } = await supabaseAdmin
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();

  if (error) throw error;
  return data as SupportTicket | null;
}

export async function getSupportTicketMessages(ticketId: string) {
  const { data, error } = await supabaseAdmin
    .from("support_ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as SupportMessage[];
}

export async function createSupportTicket(input: CreateSupportTicketInput) {
  const requesterName = clean(input.name);
  const requesterEmail = normalizeEmail(input.email);
  const requesterPhone = clean(input.phone);
  const topic = clean(input.topic) || "General Support";
  const message = clean(input.message);
  const subject = clean(input.subject) || `${topic}: ${message.slice(0, 72)}`;
  const source = clean(input.source) || "support_form";

  if (!requesterName || !requesterEmail || !message) {
    throw new Error("Name, email, and message are required.");
  }

  const publicAccessToken = crypto.randomBytes(24).toString("hex");
  const ticketNumber = `RO-${Date.now().toString(36).toUpperCase()}`;

  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from("support_tickets")
    .insert({
      ticket_number: ticketNumber,
      requester_name: requesterName,
      requester_email: requesterEmail,
      requester_phone: requesterPhone || null,
      topic,
      subject,
      status: "open",
      priority: "normal",
      source,
      public_access_token: publicAccessToken,
      last_message_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (ticketError) throw ticketError;

  const createdTicket = ticket as SupportTicket;

  const { error: messageError } = await supabaseAdmin
    .from("support_ticket_messages")
    .insert({
      ticket_id: createdTicket.id,
      actor_type: "creator",
      author_name: requesterName,
      author_email: requesterEmail,
      author_phone: requesterPhone || null,
      body: message,
    });

  if (messageError) throw messageError;

  await notifySupportTicketCreated(createdTicket, message);

  return createdTicket;
}

export async function createSupportReply(input: CreateSupportReplyInput) {
  const message = clean(input.message);
  const ticketId = clean(input.ticketId);
  const token = clean(input.token);

  if (!ticketId || !message) {
    throw new Error("Ticket and reply message are required.");
  }

  const ticket = await getSupportTicket(ticketId);
  if (!ticket) throw new Error("Ticket not found.");

  const actorType = input.actorType || "creator";
  const adminActor = actorType === "admin";

  if (!adminActor && token !== ticket.public_access_token) {
    throw new Error("Invalid ticket access key.");
  }

  const authorName = clean(input.authorName) || (adminActor ? "RoseOut Support" : ticket.requester_name || "Ticket requester");
  const authorEmail = normalizeEmail(input.authorEmail) || (adminActor ? process.env.ADMIN_NOTIFY_EMAIL || null : ticket.requester_email);
  const authorPhone = clean(input.authorPhone) || null;

  const { data: createdMessage, error: messageError } = await supabaseAdmin
    .from("support_ticket_messages")
    .insert({
      ticket_id: ticket.id,
      actor_type: actorType,
      author_name: authorName,
      author_email: authorEmail,
      author_phone: authorPhone,
      body: message,
    })
    .select("*")
    .single();

  if (messageError) throw messageError;

  await supabaseAdmin
    .from("support_tickets")
    .update({
      status: adminActor ? "waiting_on_customer" : "open",
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticket.id);

  await notifySupportReply(ticket, message, actorType);

  return createdMessage as SupportMessage;
}

async function notifySupportTicketCreated(ticket: SupportTicket, message: string) {
  const ticketUrl = makeTicketUrl(ticket);
  const adminTicketUrl = makeAdminTicketUrl(ticket.id);
  const replyTo = makeSupportReplyAddress(ticket);

  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  const adminPhone = process.env.ADMIN_NOTIFY_PHONE;

  if (adminEmail || adminPhone) {
    await sendNotification({
      toEmail: adminEmail,
      toPhone: adminPhone,
      replyTo,
      subject: `New support ticket ${ticket.ticket_number || ""}: ${ticket.subject}`,
      emailHtml: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
          <h2>New RoseOut Support Ticket</h2>
          <p><strong>Ticket:</strong> ${htmlEscape(ticket.ticket_number || ticket.id)}</p>
          <p><strong>From:</strong> ${htmlEscape(ticket.requester_name || "")} &lt;${htmlEscape(ticket.requester_email)}&gt;</p>
          <p><strong>Phone:</strong> ${htmlEscape(ticket.requester_phone || "Not provided")}</p>
          <p><strong>Topic:</strong> ${htmlEscape(ticket.topic || "General Support")}</p>
          <p><strong>Message:</strong></p>
          <p>${nl2br(message)}</p>
          <p><a href="${adminTicketUrl}" style="background:#e1062a;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">Open admin ticket</a></p>
          <p>Reply directly to this email to add an admin response.</p>
        </div>
      `,
      smsBody: `RoseOut support ${ticket.ticket_number || ticket.id}: ${ticket.subject}. Open: ${adminTicketUrl}`,
    });
  }

  await sendNotification({
    toEmail: ticket.requester_email,
    toPhone: ticket.requester_phone,
    replyTo,
    subject: `We received your RoseOut ticket ${ticket.ticket_number || ""}`,
    emailHtml: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>We received your support request</h2>
        <p>Hi ${htmlEscape(ticket.requester_name || "there")}, your ticket is open and our team has been notified.</p>
        <p><strong>Ticket:</strong> ${htmlEscape(ticket.ticket_number || ticket.id)}</p>
        <p><strong>Subject:</strong> ${htmlEscape(ticket.subject)}</p>
        <p><a href="${ticketUrl}" style="background:#e1062a;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">View or reply to ticket</a></p>
        <p>You can also reply directly to this email.</p>
      </div>
    `,
    smsBody: `RoseOut: We received ticket ${ticket.ticket_number || ticket.id}. View/reply: ${ticketUrl}`,
  });
}

async function notifySupportReply(ticket: SupportTicket, message: string, actorType: SupportActor) {
  const ticketUrl = makeTicketUrl(ticket);
  const adminTicketUrl = makeAdminTicketUrl(ticket.id);
  const replyTo = makeSupportReplyAddress(ticket);
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  const adminPhone = process.env.ADMIN_NOTIFY_PHONE;
  const creatorIsRecipient = actorType === "admin";

  await sendNotification({
    toEmail: creatorIsRecipient ? ticket.requester_email : adminEmail,
    toPhone: creatorIsRecipient ? ticket.requester_phone : adminPhone,
    replyTo,
    subject: `New reply on RoseOut ticket ${ticket.ticket_number || ""}`,
    emailHtml: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>New support ticket reply</h2>
        <p><strong>Ticket:</strong> ${htmlEscape(ticket.ticket_number || ticket.id)}</p>
        <p>${nl2br(message)}</p>
        <p><a href="${creatorIsRecipient ? ticketUrl : adminTicketUrl}" style="background:#e1062a;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">Open ticket</a></p>
        <p>Reply directly to this email to continue the conversation.</p>
      </div>
    `,
    smsBody: `RoseOut ticket ${ticket.ticket_number || ticket.id} has a new reply. Open: ${creatorIsRecipient ? ticketUrl : adminTicketUrl}`,
  });
}

export function extractTicketReplyAddress(value: string) {
  const match = value.match(/support\+([a-f0-9-]+)\.([a-f0-9]+)@/i);
  if (!match) return null;

  return {
    ticketId: match[1],
    token: match[2],
  };
}
