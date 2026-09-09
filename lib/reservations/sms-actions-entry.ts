import "server-only";
import { processReservationSmsAction as processCore } from "./sms-actions";
import { processReservationLateArrival } from "./sms-late-arrival";

type ReservationSmsActionInput = {
  from: string;
  text: string;
  providerMessageId?: string | null;
  eventId?: string | null;
  to?: string | null;
};

export async function processReservationSmsAction(input: ReservationSmsActionInput) {
  const lateArrival = await processReservationLateArrival(input);
  if (lateArrival.handled) return lateArrival;
  return processCore(input);
}
