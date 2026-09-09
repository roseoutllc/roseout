import "server-only";
import { parseReservationSmsIntent as parseCore } from "./sms-intent";

export type ReservationSmsIntent = {
  intent: "cancel" | "change_time" | "change_date" | "change_party" | "late_arrival" | "details" | "help" | "unknown";
  requested_date: string | null;
  requested_time: string | null;
  requested_party_size: number | null;
  delay_minutes?: number | null;
  estimated_arrival_time?: string | null;
  confidence: number;
};

export async function parseReservationSmsIntent(input: {
  text: string;
  currentDate: string;
  reservationDate?: string | null;
  reservationTime?: string | null;
  partySize?: number | null;
}): Promise<ReservationSmsIntent & { source: "deterministic" | "learned" | "fallback" | "ai" }> {
  return parseCore(input);
}
