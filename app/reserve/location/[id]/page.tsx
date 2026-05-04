"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Slot = {
  time: string;
  label: string;
  remaining: number;
};

type Item = {
  id: string;
  item_name: string;
  capacity_min: number;
  capacity_max: number;
  available_slots?: Slot[];
};

export default function ReserveLocationPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const locationId = String(params.id || "");
  const locationType = searchParams.get("type") || "restaurant";

  const rescheduleToken = searchParams.get("rescheduleToken") || "";
  const prefillDate = searchParams.get("date") || "";
  const prefillPartySize = searchParams.get("partySize") || "";
  const prefillItem = searchParams.get("item") || "";

  const [location, setLocation] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [partySize, setPartySize] = useState(Number(prefillPartySize || 2));
  const [date, setDate] = useState(
    prefillDate || new Date().toISOString().slice(0, 10)
  );

  const [selectedItem, setSelectedItem] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const query = new URLSearchParams({
        locationId,
        type: locationType,
        reservationDate: date,
        partySize: String(partySize),
      });

      const res = await fetch(`/api/reserve/location?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Unable to load reservation.");

      setLocation(data.location);
      setItems(data.items || []);

      const preferred =
        data.items?.find((i: Item) => i.id === prefillItem) || data.items?.[0];

      if (preferred) {
        setSelectedItem(preferred.id);
        setSelectedTime(preferred.available_slots?.[0]?.time || "");
      } else {
        setSelectedItem("");
        setSelectedTime("");
      }
    } catch (err: any) {
      setError(err?.message || "Unable to load reservation.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (locationId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, date, partySize]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");

      const res = await fetch("/api/reserve/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_id: locationId,
          location_type: locationType,
          bookable_item_id: selectedItem,
          reservation_date: date,
          reservation_time: selectedTime,
          party_size: partySize,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          reschedule_token: rescheduleToken || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Unable to create reservation.");

      setSuccess(
        rescheduleToken
          ? "Reservation rescheduled successfully. Your old reservation was cancelled."
          : data.auto_confirmed
            ? "Reservation confirmed successfully."
            : "Reservation request sent successfully."
      );

      await loadData();
    } catch (err: any) {
      setError(err?.message || "Unable to create reservation.");
    }
  }

  const currentItem = items.find((i) => i.id === selectedItem);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <section className="mx-auto max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-400">
          RoseOut Reserve
        </p>

        <h1 className="mt-3 text-4xl font-black">
          {rescheduleToken ? "Reschedule Reservation" : "Reserve Your Spot"}
        </h1>

        <p className="mt-3 text-sm text-white/60">
          {location?.name || "Select your date, party size, and available time."}
        </p>

        {rescheduleToken && (
          <div className="mt-5 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4 text-sm font-bold text-yellow-100">
            You are rescheduling an existing reservation. Once this new
            reservation is created, the previous reservation will be cancelled.
          </div>
        )}

        {loading ? (
          <p className="mt-10 text-white/50">Loading availability...</p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-100">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">
                {success}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">
                Date
              </span>
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 font-bold text-white outline-none focus:border-red-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">
                Party Size
              </span>
              <input
                type="number"
                required
                min={1}
                max={300}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value || 1))}
                className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 font-bold text-white outline-none focus:border-red-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">
                What would you like to reserve?
              </span>
              <select
                required
                value={selectedItem}
                onChange={(e) => {
                  setSelectedItem(e.target.value);
                  const nextItem = items.find((i) => i.id === e.target.value);
                  setSelectedTime(nextItem?.available_slots?.[0]?.time || "");
                }}
                className="w-full rounded-2xl border border-white/10 bg-black p-4 font-bold text-white outline-none focus:border-red-400"
              >
                {items.length === 0 ? (
                  <option value="">No available options</option>
                ) : (
                  items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.item_name} · {item.capacity_min}-{item.capacity_max} guests
                    </option>
                  ))
                )}
              </select>
            </label>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs font-black uppercase tracking-widest text-white/50">
                Available Times
              </p>

              {currentItem?.available_slots?.length ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {currentItem.available_slots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        selectedTime === slot.time
                          ? "border-red-400 bg-red-600 text-white"
                          : "border-white/10 bg-white/10 text-white/75 hover:bg-white/20"
                      }`}
                    >
                      <span className="block font-black">{slot.label}</span>
                      <span className="mt-1 block text-xs text-white/50">
                        {slot.remaining} left
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm font-bold text-yellow-200">
                  No available times for this selection.
                </p>
              )}
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">
                Name
              </span>
              <input
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 font-bold text-white outline-none placeholder:text-white/30 focus:border-red-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">
                Email
              </span>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 font-bold text-white outline-none placeholder:text-white/30 focus:border-red-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">
                Phone
              </span>
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 font-bold text-white outline-none placeholder:text-white/30 focus:border-red-400"
              />
            </label>

            <button
              type="submit"
              disabled={!selectedItem || !selectedTime}
              className="w-full rounded-full bg-red-600 p-4 font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {rescheduleToken ? "Reschedule Reservation" : "Reserve"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}