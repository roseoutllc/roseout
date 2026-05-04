import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function buildSlots(date: string, durationMinutes: number) {
  const slots: string[] = [];

  const start = new Date(`${date}T17:00:00`);
  const end = new Date(`${date}T22:00:00`);

  let current = start;

  while (current < end) {
    slots.push(current.toISOString());
    current = new Date(current.getTime() + 30 * 60000);
  }

  return slots;
}

function overlaps(
  slotStart: Date,
  slotDuration: number,
  bookingStart: Date,
  bookingDuration: number
) {
  const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
  const bookingEnd = new Date(
    bookingStart.getTime() + bookingDuration * 60000
  );

  return slotStart < bookingEnd && slotEnd > bookingStart;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const locationId = searchParams.get("locationId");
  const locationType = searchParams.get("locationType") || "restaurant";
  const date = searchParams.get("date");

  if (!locationId || !date) {
    return NextResponse.json(
      { error: "Missing locationId or date" },
      { status: 400 }
    );
  }

  const tableName = locationType === "activity" ? "activities" : "restaurants";

  const { data: location } = await supabase
    .from(tableName)
    .select("id, default_duration_minutes")
    .eq("id", locationId)
    .single();

  const durationMinutes = location?.default_duration_minutes || 90;

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  const { data: reservations } = await supabase
    .from("reservations")
    .select("id, reservation_time, duration_minutes, status")
    .eq("location_id", locationId)
    .eq("location_type", locationType)
    .gte("reservation_time", dayStart.toISOString())
    .lte("reservation_time", dayEnd.toISOString())
    .neq("status", "cancelled");

  const slots = buildSlots(date, durationMinutes);

  const availableSlots = slots.filter((slot) => {
    const slotStart = new Date(slot);

    return !(reservations || []).some((reservation) =>
      overlaps(
        slotStart,
        durationMinutes,
        new Date(reservation.reservation_time),
        reservation.duration_minutes || durationMinutes
      )
    );
  });

  return NextResponse.json({
    durationMinutes,
    slots: availableSlots,
  });
}