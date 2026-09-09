import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizePhone } from "@/lib/sms/telnyx";
import { sendSms } from "@/lib/sms/sendSms";
import { parseReservationSmsIntent, type ReservationSmsIntent } from "@/lib/reservations/sms-intent";
import { appendReservationMessage } from "@/lib/communications/reservation-thread";
import { getLocationName } from "@/lib/locationName";

const ACTIVE_STATUSES = ["pending", "confirmed", "checked_in", "waiting", "arrived"];
const SESSION_MINUTES = 20;

type Reservation = {
  id: string;
  location_id: string;
  location_type?: string | null;
  user_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  reservation_date: string;
  reservation_time: string;
  party_size?: number | null;
  status?: string | null;
};

type Input = {
  from: string;
  text: string;
  providerMessageId?: string | null;
  eventId?: string | null;
  to?: string | null;
};

function expiresAt() {
  return new Date(Date.now() + SESSION_MINUTES * 60_000).toISOString();
}

function formatTime(value?: string | null) {
  const [hourRaw, minuteRaw = "00"] = String(value || "00:00").slice(0, 5).split(":");
  const hour = Number(hourRaw);
  return `${hour % 12 || 12}:${minuteRaw} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatDate(value?: string | null) {
  const raw = String(value || "");
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : raw;
}

async function activeReservations(phone: string): Promise<Reservation[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("location_reservations")
    .select("id,location_id,location_type,user_id,customer_name,customer_phone,reservation_date,reservation_time,party_size,status")
    .eq("customer_phone", phone)
    .gte("reservation_date", today)
    .in("status", ACTIVE_STATUSES)
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true })
    .limit(5);
  if (error) return [];
  return (data || []) as Reservation[];
}

async function getLocationLabel(locationId: string) {
  const { data } = await supabaseAdmin
    .from("locations")
    .select("id,name,restaurant_name,activity_name,business_name")
    .eq("id", locationId)
    .maybeSingle();
  return getLocationName(data || {}, "your reservation");
}

async function appendInbound(reservation: Reservation, input: Input) {
  await appendReservationMessage({
    reservation,
    direction: "inbound",
    channel: "sms",
    body: input.text,
    provider: "telnyx",
    providerMessageId: input.providerMessageId || null,
    sourceRecordId: input.eventId ? `telnyx-event:${input.eventId}` : `late-arrival:${crypto.randomUUID()}`,
    recipientAddress: normalizePhone(input.from),
    metadata: { source: "reservation_late_arrival", to: input.to || null },
  });
}

async function reply(phone: string, reservation: Reservation | null, body: string) {
  const result = await sendSms({ to: phone, body });
  if (!reservation) return;
  await appendReservationMessage({
    reservation,
    direction: "outbound",
    channel: "sms",
    body,
    provider: "telnyx",
    providerMessageId: result.id || null,
    sourceRecordId: `late-arrival-reply:${crypto.randomUUID()}`,
    recipientAddress: phone,
    metadata: { source: "reservation_late_arrival" },
  });
}

async function saveSelectionSession(phone: string, reservations: Reservation[], intent: ReservationSmsIntent, input: Input) {
  await supabaseAdmin.from("reservation_sms_sessions").upsert({
    phone_e164: phone,
    reservation_id: null,
    state: "late_arrival_select",
    pending_action: "late_arrival",
    pending_data: {
      reservation_ids: reservations.map((reservation) => reservation.id),
      intent,
      initial_message: input,
    },
    expires_at: expiresAt(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "phone_e164" });
}

async function clearSelectionSession(phone: string) {
  await supabaseAdmin.from("reservation_sms_sessions").delete().eq("phone_e164", phone).eq("state", "late_arrival_select");
}

async function getSelectionSession(phone: string) {
  const { data } = await supabaseAdmin
    .from("reservation_sms_sessions")
    .select("state,pending_data,expires_at")
    .eq("phone_e164", phone)
    .eq("state", "late_arrival_select")
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await clearSelectionSession(phone);
    return null;
  }
  return data as { state: string; pending_data: Record<string, any> | null; expires_at: string };
}

async function recordLateArrival(phone: string, reservation: Reservation, intent: ReservationSmsIntent, input: Input) {
  const now = new Date().toISOString();
  const delayMinutes = intent.delay_minutes || null;
  const eta = intent.estimated_arrival_time || null;
  const note = input.text.slice(0, 500);

  await appendInbound(reservation, input);

  const { error } = await supabaseAdmin
    .from("location_reservations")
    .update({
      late_arrival_reported_at: now,
      late_arrival_minutes: delayMinutes,
      late_arrival_eta: eta,
      late_arrival_note: note,
      updated_at: now,
    })
    .eq("id", reservation.id);
  if (error) throw error;

  await Promise.allSettled([
    supabaseAdmin.from("reservation_activity_logs").insert({
      location_id: reservation.location_id,
      reservation_id: reservation.id,
      action: "guest_late_arrival_reported",
      details: { delay_minutes: delayMinutes, eta, source: "sms", note },
    }),
    supabaseAdmin.from("reserve_service_events").insert({
      location_id: reservation.location_id,
      reservation_id: reservation.id,
      event_type: "guest_late_arrival",
      metadata: { delay_minutes: delayMinutes, eta, source: "sms", note },
      created_at: now,
    }),
  ]);

  const name = await getLocationLabel(reservation.location_id);
  const delayText = delayMinutes ? ` about ${delayMinutes} minute${delayMinutes === 1 ? "" : "s"} late` : " late";
  const etaText = eta ? ` with an ETA around ${formatTime(eta)}` : "";
  await reply(phone, reservation, `Thanks for the update. I let ${name} know you’re running${delayText}${etaText}. Your reservation is still scheduled for ${formatTime(reservation.reservation_time)}.`);
}

export async function processReservationLateArrival(input: Input) {
  const phone = normalizePhone(input.from);
  const raw = input.text.trim();
  if (!phone || !raw) return { handled: false as const };

  const session = await getSelectionSession(phone);
  if (session) {
    if (raw.toUpperCase() === "NO") {
      await clearSelectionSession(phone);
      await reply(phone, null, "No problem. I didn’t send a late-arrival update to a host.");
      return { handled: true as const, action: "late_arrival_selection_cancelled" };
    }

    const ids = Array.isArray(session.pending_data?.reservation_ids) ? session.pending_data!.reservation_ids : [];
    const index = Number(raw) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= ids.length) {
      await reply(phone, null, `Reply with a reservation number from 1 to ${ids.length}, or NO to exit.`);
      return { handled: true as const, action: "late_arrival_selection_retry" };
    }

    const reservations = await activeReservations(phone);
    const reservation = reservations.find((entry) => entry.id === String(ids[index]));
    if (!reservation) {
      await clearSelectionSession(phone);
      return { handled: false as const };
    }

    const intent = session.pending_data?.intent as ReservationSmsIntent | undefined;
    const initial = (session.pending_data?.initial_message || input) as Input;
    await clearSelectionSession(phone);
    await recordLateArrival(phone, reservation, intent || { intent: "late_arrival", requested_date: null, requested_time: null, requested_party_size: null, delay_minutes: null, estimated_arrival_time: null, confidence: 0.8 }, initial);
    return { handled: true as const, action: "late_arrival_recorded", reservationId: reservation.id, locationId: reservation.location_id };
  }

  const reservations = await activeReservations(phone);
  if (!reservations.length) return { handled: false as const };
  const first = reservations[0];
  const intent = await parseReservationSmsIntent({
    text: raw,
    currentDate: new Date().toISOString().slice(0, 10),
    reservationDate: first.reservation_date,
    reservationTime: first.reservation_time,
    partySize: first.party_size,
  });

  if (intent.intent !== "late_arrival" || intent.confidence < 0.8) return { handled: false as const };

  if (reservations.length > 1) {
    await saveSelectionSession(phone, reservations, intent, input);
    const rows = await Promise.all(reservations.map(async (reservation, index) => `${index + 1}. ${await getLocationLabel(reservation.location_id)} — ${formatDate(reservation.reservation_date)} at ${formatTime(reservation.reservation_time)}`));
    await reply(phone, null, `Which reservation are you running late for?\n\n${rows.join("\n")}\n\nReply with the reservation number, or NO to exit.`);
    return { handled: true as const, action: "late_arrival_select_reservation" };
  }

  await recordLateArrival(phone, first, intent, input);
  return { handled: true as const, action: "late_arrival_recorded", reservationId: first.id, locationId: first.location_id };
}
