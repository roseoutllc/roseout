import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const supportTicketsMaybeSingle = vi.fn();
const supportTicketsUpdateEq = vi.fn();
const reservationMaybeSingle = vi.fn();

const supportTicketsBuilder = {
  select: vi.fn(() => ({
    eq: vi.fn(() => ({ maybeSingle: supportTicketsMaybeSingle })),
  })),
  update: vi.fn(() => ({ eq: supportTicketsUpdateEq })),
};

const reservationBuilder = {
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      limit: vi.fn(() => ({ maybeSingle: reservationMaybeSingle })),
    })),
  })),
};

const from = vi.fn((table: string) => {
  if (table === "support_tickets") return supportTicketsBuilder;
  if (table === "location_reservations") return reservationBuilder;
  throw new Error(`Unexpected table: ${table}`);
});

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from,
    auth: { admin: { listUsers: vi.fn() } },
  },
}));

vi.mock("@/lib/email/sendSupportEmail", () => ({ sendSupportEmail: vi.fn() }));
vi.mock("@/lib/sms/telnyx", () => ({ normalizePhone: (value: string | null | undefined) => value || "" }));

import { getSupportIdentityGateDecision } from "@/lib/support/identity-verification";

function pendingTicket(code = "654321") {
  const salt = "support-test-salt";
  const codeHash = crypto.scryptSync(code, salt, 32).toString("hex");
  return {
    id: "ticket-1",
    requester_phone: null,
    requester_email: null,
    metadata: {
      support_identity_verification: {
        state: "pending",
        target_type: "reservation",
        target_id: "reservation-1",
        scope: "reservation:reservation-1",
        salt,
        code_hash: codeHash,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        attempts: 0,
      },
    },
  };
}

describe("support identity verification regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supportTicketsMaybeSingle.mockResolvedValue({ data: null, error: null });
    supportTicketsUpdateEq.mockResolvedValue({ error: null });
    reservationMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it("does not parse the word status as a reservation confirmation code", async () => {
    supportTicketsMaybeSingle.mockResolvedValue({
      data: { id: "ticket-1", requester_phone: null, requester_email: null, metadata: {} },
      error: null,
    });

    const result = await getSupportIdentityGateDecision({
      ticketId: "ticket-1",
      latestMessage: "What is my reservation status?",
    });

    expect(result?.reason).toBe("support_identity_reservation_code_required");
    expect(reservationMaybeSingle).not.toHaveBeenCalled();
  });

  it("bypasses the verification database for routine non-sensitive login/password support", async () => {
    const result = await getSupportIdentityGateDecision({
      ticketId: "ticket-1",
      latestMessage: "I forgot my password and cannot log in. How do I reset it?",
    });

    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("accepts a standalone six-digit OTP while a challenge is pending", async () => {
    supportTicketsMaybeSingle.mockResolvedValue({ data: pendingTicket(), error: null });

    const result = await getSupportIdentityGateDecision({
      ticketId: "ticket-1",
      latestMessage: "654321",
    });

    expect(result?.reason).toBe("support_identity_verified");
    expect(supportTicketsBuilder.update).toHaveBeenCalledTimes(1);
  });
});
