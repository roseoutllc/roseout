import crypto from "node:crypto";

import { sendSupportEmail } from "@/lib/email/sendSupportEmail";
import { normalizePhone } from "@/lib/sms/telnyx";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type SupportIdentityGateResult = {
  message: string;
  reason: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  resolved?: boolean;
  metadata: Record<string, unknown>;
};

type VerificationState = {
  state: "pending" | "verified" | "locked";
  target_type: "reservation" | "account";
  target_id: string;
  scope: string;
  destination_hint?: string | null;
  salt?: string | null;
  code_hash?: string | null;
  expires_at?: string | null;
  verified_at?: string | null;
  verified_until?: string | null;
  attempts?: number;
};

type SupportTicket = {
  id: string;
  requester_phone: string | null;
  requester_email: string | null;
  metadata: Record<string, unknown> | null;
};

const VERIFICATION_TTL_MS = 10 * 60 * 1000;
const VERIFIED_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const SENSITIVE_SUPPORT = /\b(refund|refund my|chargeback|billing dispute|unauthorized charge|payment method|credit card|bank account|delete my account|close my account|change my email|change my phone|change my account email|change my account phone|reservation status|booking status|my reservation|my booking|change my reservation|modify my reservation|reschedule my reservation|cancel my reservation|cancel my booking|party size|confirmation details|support history|my support history|account history|transfer ownership|ownership transfer|account details|account information|what email is on my account|what phone is on my account)\b/i;
const RESERVATION_SENSITIVE = /\b(reservation|booking|deposit|party size|confirmation)\b/i;
const ACCOUNT_SENSITIVE = /\b(account|email|phone|support history|ownership)\b/i;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const OTP_PATTERN = /^\s*(\d{6})\s*$/;
const RESERVATION_CODE_PATTERN = /\b(?:confirmation|reservation|booking)\s*(?:code|number|#)\s*[:#-]?\s*([A-Z0-9]{6,16})\b/i;

function clean(value: unknown) {
  return String(value || "").trim();
}

function metadataState(metadata: Record<string, unknown> | null): VerificationState | null {
  const raw = metadata?.support_identity_verification;
  if (!raw || typeof raw !== "object") return null;
  return raw as VerificationState;
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "the email on file";
  const first = local.slice(0, 1);
  return `${first}${"*".repeat(Math.min(4, Math.max(2, local.length - 1)))}@${domain}`;
}

function hashCode(code: string, salt: string) {
  return crypto.scryptSync(code, salt, 32).toString("hex");
}

function codeMatches(code: string, state: VerificationState) {
  if (!state.salt || !state.code_hash) return false;
  const expected = Buffer.from(state.code_hash, "hex");
  const actual = Buffer.from(hashCode(code, state.salt), "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function isFuture(value?: string | null) {
  const time = new Date(String(value || "")).getTime();
  return Number.isFinite(time) && time > Date.now();
}

async function loadTicket(ticketId: string): Promise<SupportTicket | null> {
  const { data, error } = await supabaseAdmin
    .from("support_tickets")
    .select("id,requester_phone,requester_email,metadata")
    .eq("id", ticketId)
    .maybeSingle();
  if (error) throw error;
  return data as SupportTicket | null;
}

async function writeVerification(ticket: SupportTicket, state: VerificationState) {
  const metadata = { ...(ticket.metadata || {}), support_identity_verification: state };
  const { error } = await supabaseAdmin
    .from("support_tickets")
    .update({ metadata, updated_at: new Date().toISOString() })
    .eq("id", ticket.id);
  if (error) throw error;
  ticket.metadata = metadata;
}

async function sendChallenge(params: {
  ticket: SupportTicket;
  targetType: "reservation" | "account";
  targetId: string;
  email: string;
}) {
  const code = String(crypto.randomInt(100000, 1000000));
  const salt = crypto.randomBytes(16).toString("hex");
  const now = Date.now();
  const scope = `${params.targetType}:${params.targetId}`;
  const state: VerificationState = {
    state: "pending",
    target_type: params.targetType,
    target_id: params.targetId,
    scope,
    destination_hint: maskEmail(params.email),
    salt,
    code_hash: hashCode(code, salt),
    expires_at: new Date(now + VERIFICATION_TTL_MS).toISOString(),
    attempts: 0,
  };
  await writeVerification(params.ticket, state);
  await sendSupportEmail({
    to: params.email,
    subject: "Your TheOutHaven support verification code",
    body: `Your TheOutHaven support verification code is ${code}. It expires in 10 minutes. Do not share this code with anyone outside the support conversation you started. If you did not request this code, you can ignore this email.`,
  });
  return state;
}

async function findReservationByConfirmationCode(code: string) {
  const { data, error } = await supabaseAdmin
    .from("location_reservations")
    .select("id,confirmation_code,customer_email,customer_phone")
    .eq("confirmation_code", code)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function findAuthUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((user) => String(user.email || "").trim().toLowerCase() === normalized);
    if (match) return match;
    if (data.users.length < 200) break;
  }
  return null;
}

async function verifyPendingCode(ticket: SupportTicket, state: VerificationState, code: string): Promise<SupportIdentityGateResult> {
  if (!isFuture(state.expires_at)) {
    await writeVerification(ticket, { ...state, state: "locked", code_hash: null, salt: null });
    return {
      message: "That verification code expired. Tell me what account or reservation you need help with and I’ll start a new verification.",
      reason: "support_identity_code_expired",
      category: state.target_type === "reservation" ? "Reservations" : "Account",
      priority: "normal",
      metadata: { support_tool: "identity_verification", verification_state: "expired", scope: state.scope },
    };
  }

  if (!codeMatches(code, state)) {
    const attempts = Number(state.attempts || 0) + 1;
    const locked = attempts >= MAX_ATTEMPTS;
    await writeVerification(ticket, {
      ...state,
      attempts,
      state: locked ? "locked" : "pending",
      ...(locked ? { code_hash: null, salt: null } : {}),
    });
    return {
      message: locked
        ? "That verification attempt limit was reached. For security, I stopped this verification. A support specialist can start a new one after reviewing the request."
        : "That code didn’t match. Check the six-digit code we sent and try again.",
      reason: locked ? "support_identity_attempt_limit" : "support_identity_code_mismatch",
      category: state.target_type === "reservation" ? "Reservations" : "Account",
      priority: locked ? "high" : "normal",
      metadata: { support_tool: "identity_verification", verification_state: locked ? "locked" : "pending", attempts, scope: state.scope },
    };
  }

  const now = new Date();
  const verified: VerificationState = {
    ...state,
    state: "verified",
    code_hash: null,
    salt: null,
    verified_at: now.toISOString(),
    verified_until: new Date(now.getTime() + VERIFIED_TTL_MS).toISOString(),
    attempts: 0,
  };
  await writeVerification(ticket, verified);
  return {
    message: "Verification complete. I’ve marked this support conversation as verified for this specific request. I’m bringing in a support specialist for the private account or reservation action.",
    reason: "support_identity_verified",
    category: state.target_type === "reservation" ? "Reservations" : "Account",
    priority: "high",
    metadata: { support_tool: "identity_verification", verification_state: "verified", scope: state.scope, verified_until: verified.verified_until, requires_human_action: true },
  };
}

async function reservationGate(ticket: SupportTicket, latestMessage: string): Promise<SupportIdentityGateResult> {
  const codeMatch = latestMessage.match(RESERVATION_CODE_PATTERN);
  const confirmationCode = clean(codeMatch?.[1]).toUpperCase();
  if (!confirmationCode || confirmationCode.length < 6) {
    return {
      message: "I can help with that, but I need to verify the reservation before I access or change private details. Reply with the reservation confirmation code from your confirmation message. Do not send payment-card information.",
      reason: "support_identity_reservation_code_required",
      category: "Reservations",
      priority: "normal",
      metadata: { support_tool: "identity_verification", verification_state: "target_required", target_type: "reservation" },
    };
  }

  const reservation = await findReservationByConfirmationCode(confirmationCode);
  if (!reservation?.id) {
    return {
      message: "I couldn’t verify a reservation from that code. Check the confirmation code and try again. I won’t reveal whether any other reservation details match.",
      reason: "support_identity_reservation_not_verified",
      category: "Reservations",
      priority: "normal",
      metadata: { support_tool: "identity_verification", verification_state: "target_not_verified", target_type: "reservation" },
    };
  }

  const email = clean(reservation.customer_email).toLowerCase();
  if (email) {
    const state = await sendChallenge({ ticket, targetType: "reservation", targetId: reservation.id, email });
    return {
      message: `I found the reservation. I sent a six-digit verification code to ${state.destination_hint}. Reply with that code here. It expires in 10 minutes.`,
      reason: "support_identity_reservation_challenge_sent",
      category: "Reservations",
      priority: "normal",
      metadata: { support_tool: "identity_verification", verification_state: "pending", target_type: "reservation", scope: state.scope, destination_hint: state.destination_hint },
    };
  }

  const requesterPhone = normalizePhone(ticket.requester_phone);
  const reservationPhone = normalizePhone(reservation.customer_phone);
  if (requesterPhone && reservationPhone && requesterPhone === reservationPhone) {
    const now = new Date();
    const state: VerificationState = {
      state: "verified",
      target_type: "reservation",
      target_id: reservation.id,
      scope: `reservation:${reservation.id}`,
      verified_at: now.toISOString(),
      verified_until: new Date(now.getTime() + VERIFIED_TTL_MS).toISOString(),
    };
    await writeVerification(ticket, state);
    return {
      message: "Reservation verification complete using the confirmation code plus the phone tied to the reservation. I’m bringing in a support specialist for the private action.",
      reason: "support_identity_reservation_verified_by_code_and_phone",
      category: "Reservations",
      priority: "high",
      metadata: { support_tool: "identity_verification", verification_state: "verified", scope: state.scope, verified_until: state.verified_until, requires_human_action: true },
    };
  }

  return {
    message: "I found the reservation, but there isn’t a separate verified email available for a one-time code and this text number doesn’t match the reservation phone. I’m handing this to a support specialist for manual verification before any private details are accessed or changed.",
    reason: "support_identity_reservation_manual_verification_required",
    category: "Reservations",
    priority: "high",
    metadata: { support_tool: "identity_verification", verification_state: "manual_review", target_type: "reservation", target_id: reservation.id, requires_human_action: true },
  };
}

async function accountGate(ticket: SupportTicket, latestMessage: string): Promise<SupportIdentityGateResult> {
  const email = clean(latestMessage.match(EMAIL_PATTERN)?.[0]).toLowerCase();
  if (!email) {
    return {
      message: "I can help with the account issue, but I need to verify identity before accessing or changing private account information. Reply with the email address on the account. I won’t ask for your password or authentication codes from any other service.",
      reason: "support_identity_account_email_required",
      category: "Account",
      priority: "normal",
      metadata: { support_tool: "identity_verification", verification_state: "target_required", target_type: "account" },
    };
  }

  const user = await findAuthUserByEmail(email);
  if (user?.id && user.email) {
    const state = await sendChallenge({ ticket, targetType: "account", targetId: user.id, email: user.email });
    return {
      message: `If that address matches your account, a six-digit verification code was sent to ${state.destination_hint}. Reply with the code here. It expires in 10 minutes.`,
      reason: "support_identity_account_challenge_sent",
      category: "Account",
      priority: "normal",
      metadata: { support_tool: "identity_verification", verification_state: "pending", target_type: "account", scope: state.scope, destination_hint: state.destination_hint },
    };
  }

  return {
    message: "If that address matches a TheOutHaven account, verification instructions will be sent there. If nothing arrives, check the address and try again or I can bring in a support specialist. I won’t confirm whether an account exists from this text conversation.",
    reason: "support_identity_account_challenge_generic",
    category: "Account",
    priority: "normal",
    metadata: { support_tool: "identity_verification", verification_state: "target_not_verified", target_type: "account" },
  };
}

export function isSensitiveSupportRequest(message: string) {
  return SENSITIVE_SUPPORT.test(message);
}

export async function hasActiveSupportVerification(ticketId: string, scope?: string) {
  const ticket = await loadTicket(ticketId);
  const state = ticket ? metadataState(ticket.metadata) : null;
  if (!state || state.state !== "verified" || !isFuture(state.verified_until)) return false;
  return scope ? state.scope === scope : true;
}

export async function getSupportIdentityGateDecision(params: {
  ticketId: string;
  latestMessage: string;
}): Promise<SupportIdentityGateResult | null> {
  const latestMessage = params.latestMessage.trim();
  if (!latestMessage) return null;

  const otp = latestMessage.match(OTP_PATTERN)?.[1];
  if (!otp && !isSensitiveSupportRequest(latestMessage)) return null;

  const ticket = await loadTicket(params.ticketId);
  if (!ticket) return null;
  const state = metadataState(ticket.metadata);

  if (otp && state?.state === "pending") return verifyPendingCode(ticket, state, otp);
  if (!isSensitiveSupportRequest(latestMessage)) return null;

  if (state?.state === "verified" && isFuture(state.verified_until)) {
    return {
      message: "This support conversation is already verified for the private request in progress. I’m keeping the verification scoped to that account or reservation and handing the action to a support specialist.",
      reason: "support_identity_already_verified",
      category: state.target_type === "reservation" ? "Reservations" : "Account",
      priority: "high",
      metadata: { support_tool: "identity_verification", verification_state: "verified", scope: state.scope, verified_until: state.verified_until, requires_human_action: true },
    };
  }

  if (RESERVATION_SENSITIVE.test(latestMessage)) return reservationGate(ticket, latestMessage);
  if (ACCOUNT_SENSITIVE.test(latestMessage)) return accountGate(ticket, latestMessage);

  return {
    message: "I can help with that, but this request involves private information or a sensitive change. I’m handing it to a support specialist, who will verify identity before accessing or changing anything private.",
    reason: "support_identity_manual_verification_required",
    category: "General Support",
    priority: "high",
    metadata: { support_tool: "identity_verification", verification_state: "manual_review", requires_human_action: true },
  };
}
