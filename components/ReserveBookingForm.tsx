"use client";

import { useEffect, useState } from "react";

type Props = {
  locationId: string;
  locationType: string;
  locationName: string;
  defaultDuration: number;
};

function formatSlot(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReserveBookingForm({
  locationId,
  locationType,
  locationName,
  defaultDuration,
}: Props) {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [duration, setDuration] = useState(defaultDuration);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;

    async function loadSlots() {
      setLoading(true);
      setSelectedSlot("");

      const res = await fetch(
        `/api/reserve/availability?locationId=${locationId}&locationType=${locationType}&date=${date}`
      );

      const data = await res.json();

      setSlots(data.slots || []);
      setDuration(data.durationMinutes || defaultDuration);
      setLoading(false);
    }

    loadSlots();
  }, [date, locationId, locationType, defaultDuration]);

  return (
    <div className="bg-[#f8f3ef] p-6 text-[#1b1210] lg:p-7">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-700">
        Book this location
      </p>

      <h2 className="mt-2 text-2xl font-black">Reserve your time</h2>

      <p className="mt-2 text-sm font-medium text-black/55">
        Choose an available time for {locationName}. This location blocks{" "}
        {duration} minutes per booking.
      </p>

      <form className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-black">Date</label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label className="text-sm font-black">Available times</label>

          {!date ? (
            <div className="mt-2 rounded-2xl bg-white p-4 text-sm font-bold text-black/45">
              Select a date to see available times.
            </div>
          ) : loading ? (
            <div className="mt-2 rounded-2xl bg-white p-4 text-sm font-bold text-black/45">
              Checking availability...
            </div>
          ) : !slots.length ? (
            <div className="mt-2 rounded-2xl bg-white p-4 text-sm font-bold text-black/45">
              No times available for this date.
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-full border px-4 py-3 text-sm font-black transition ${
                    selectedSlot === slot
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-black/10 bg-white text-black hover:border-rose-400"
                  }`}
                >
                  {formatSlot(slot)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Full name"
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold outline-none focus:border-rose-500"
          />

          <input
            name="party_size"
            type="number"
            min="1"
            defaultValue="2"
            placeholder="Party size"
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold outline-none focus:border-rose-500"
          />
        </div>

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold outline-none focus:border-rose-500"
        />

        <input
          name="phone"
          placeholder="Phone"
          className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold outline-none focus:border-rose-500"
        />

        <textarea
          name="notes"
          placeholder="Notes or special request"
          rows={3}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-rose-500"
        />

        <input type="hidden" name="reservation_time" value={selectedSlot} />
        <input type="hidden" name="duration_minutes" value={duration} />

        <button
          type="button"
          disabled={!selectedSlot}
          className="h-12 w-full rounded-full bg-gradient-to-r from-rose-500 to-rose-700 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
        >
          Request Reservation
        </button>
      </form>
    </div>
  );
}