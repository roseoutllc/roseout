"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import RoseOutHeader from "@/components/RoseOutHeader";

type BookableItem = {
  id: string;
  item_name: string;
  item_type: string;
  capacity_min: number;
  capacity_max: number;
};

type LocationData = {
  id: string;
  type: string;
  name: string;
  address?: string;
  image_url?: string | null;
  category?: string;
};

function normalizeType(value: string | null) {
  const type = String(value || "restaurant").toLowerCase();

  if (type === "activities") return "activity";
  if (type === "lounges") return "lounge";
  if (type === "bars") return "bar";
  if (type === "venues") return "venue";

  return type || "restaurant";
}

function prettyType(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ReserveLocationPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const locationId = String(params.id || "");
  const locationType = normalizeType(searchParams.get("type"));

  const [location, setLocation] = useState<LocationData | null>(null);
  const [items, setItems] = useState<BookableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [partySize, setPartySize] = useState(2);
  const [bookableItemId, setBookableItemId] = useState("");

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    reservation_date: "",
    reservation_time: "",
    special_request: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        partySize >= Number(item.capacity_min || 1) &&
        partySize <= Number(item.capacity_max || 999)
    );
  }, [items, partySize]);

  const selectedItem = useMemo(() => {
    return items.find((item) => item.id === bookableItemId) || null;
  }, [items, bookableItemId]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/reserve/location?locationId=${locationId}&type=${locationType}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load reservation page.");
        }

        setLocation(data.location);
        setItems(data.items || []);

        const firstAvailable = (data.items || []).find(
          (item: BookableItem) =>
            partySize >= Number(item.capacity_min || 1) &&
            partySize <= Number(item.capacity_max || 999)
        );

        if (firstAvailable) {
          setBookableItemId(firstAvailable.id);
        }
      } catch (err: any) {
        setError(err?.message || "Unable to load reservation page.");
      } finally {
        setLoading(false);
      }
    }

    if (locationId) loadData();
  }, [locationId, locationType]);

  useEffect(() => {
    if (!filteredItems.length) {
      setBookableItemId("");
      return;
    }

    const stillValid = filteredItems.some((item) => item.id === bookableItemId);

    if (!stillValid) {
      setBookableItemId(filteredItems[0].id);
    }
  }, [filteredItems, bookableItemId]);

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitReservation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess(false);

      const response = await fetch("/api/reserve/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_id: locationId,
          location_type: locationType,
          bookable_item_id: bookableItemId || null,
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          reservation_date: form.reservation_date,
          reservation_time: form.reservation_time,
          party_size: partySize,
          special_request: form.special_request,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit reservation.");
      }

      setSuccess(true);
      setForm({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        reservation_date: "",
        reservation_time: "",
        special_request: "",
      });
      setPartySize(2);
    } catch (err: any) {
      setError(err?.message || "Unable to submit reservation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <RoseOutHeader />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="relative overflow-hidden px-5 py-10 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(225,6,42,0.35),transparent_32%),radial-gradient(circle_at_90%_0%,rgba(127,29,29,0.35),transparent_28%),#000]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/80 to-black" />

          <div className="relative z-10 mx-auto max-w-6xl">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
            >
              <ArrowLeft size={16} />
              Back to RoseOut
            </Link>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_460px]">
              <div className="relative flex min-h-[520px] flex-col justify-end overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                {location?.image_url && (
                  <div
                    className="absolute inset-0 opacity-35"
                    style={{
                      backgroundImage: `url(${location.image_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/20" />

                <div className="relative z-10">
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">
                    RoseOut Reserve
                  </p>

                  <h1 className="mt-4 max-w-3xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                    Reserve your spot.
                  </h1>

                  <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
                    Request a table, room, lane, booth, section, event space,
                    activity slot, or general reservation.
                  </p>

                  <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/55 p-5 backdrop-blur-xl">
                    <p className="text-2xl font-black">
                      {loading ? "Loading location..." : location?.name}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide">
                      <span className="rounded-full bg-red-600 px-3 py-1 text-white">
                        {location?.category || locationType}
                      </span>

                      {location?.address && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/70">
                          <MapPin size={13} />
                          {location.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl sm:p-6">
                {loading ? (
                  <div className="flex min-h-[520px] items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="mx-auto animate-spin text-red-400" />
                      <p className="mt-4 text-sm font-bold text-white/60">
                        Loading reservation options...
                      </p>
                    </div>
                  </div>
                ) : success ? (
                  <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                    <div className="rounded-full bg-red-600/15 p-5 text-red-300">
                      <CheckCircle2 size={48} />
                    </div>

                    <h2 className="mt-6 text-3xl font-black">
                      Reservation request sent.
                    </h2>

                    <p className="mt-4 max-w-sm text-sm leading-7 text-white/60">
                      Your request was sent to the location. Final confirmation
                      comes from the location.
                    </p>

                    <button
                      type="button"
                      onClick={() => setSuccess(false)}
                      className="mt-7 rounded-full bg-red-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500"
                    >
                      Make Another Reservation
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submitReservation} className="space-y-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
                        Booking Details
                      </p>

                      <h2 className="mt-2 text-3xl font-black">
                        Request Reservation
                      </h2>
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-bold text-red-100">
                        {error}
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Date" icon={<CalendarDays size={16} />}>
                        <input
                          type="date"
                          required
                          value={form.reservation_date}
                          onChange={(e) =>
                            updateForm("reservation_date", e.target.value)
                          }
                          className="input"
                        />
                      </Field>

                      <Field label="Time" icon={<Clock size={16} />}>
                        <input
                          type="time"
                          required
                          value={form.reservation_time}
                          onChange={(e) =>
                            updateForm("reservation_time", e.target.value)
                          }
                          className="input"
                        />
                      </Field>
                    </div>

                    <Field label="Party Size" icon={<Users size={16} />}>
                      <input
                        type="number"
                        min={1}
                        max={300}
                        required
                        value={partySize}
                        onChange={(e) =>
                          setPartySize(Number(e.target.value || 1))
                        }
                        className="input"
                      />
                    </Field>

                    <Field
                      label="What would you like to reserve?"
                      icon={<Sparkles size={16} />}
                    >
                      {filteredItems.length > 0 ? (
                        <select
                          value={bookableItemId}
                          onChange={(e) => setBookableItemId(e.target.value)}
                          className="input"
                        >
                          {filteredItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.item_name} · {prettyType(item.item_type)} ·{" "}
                              {item.capacity_min}-{item.capacity_max} guests
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm font-bold text-yellow-100">
                          No reservation option matches this party size.
                        </div>
                      )}
                    </Field>

                    {selectedItem && (
                      <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
                          Selected
                        </p>
                        <p className="mt-2 font-black text-white">
                          {selectedItem.item_name}
                        </p>
                        <p className="mt-1 text-sm font-bold text-white/55">
                          {prettyType(selectedItem.item_type)} · Fits{" "}
                          {selectedItem.capacity_min}-{selectedItem.capacity_max}{" "}
                          guests
                        </p>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Name">
                        <input
                          type="text"
                          required
                          placeholder="Your name"
                          value={form.customer_name}
                          onChange={(e) =>
                            updateForm("customer_name", e.target.value)
                          }
                          className="input"
                        />
                      </Field>

                      <Field label="Phone">
                        <input
                          type="tel"
                          placeholder="Phone number"
                          value={form.customer_phone}
                          onChange={(e) =>
                            updateForm("customer_phone", e.target.value)
                          }
                          className="input"
                        />
                      </Field>
                    </div>

                    <Field label="Email">
                      <input
                        type="email"
                        placeholder="Email address"
                        value={form.customer_email}
                        onChange={(e) =>
                          updateForm("customer_email", e.target.value)
                        }
                        className="input"
                      />
                    </Field>

                    <Field label="Special Request">
                      <textarea
                        rows={4}
                        placeholder="Birthday, date night, accessibility needs, seating preference, etc."
                        value={form.special_request}
                        onChange={(e) =>
                          updateForm("special_request", e.target.value)
                        }
                        className="input resize-none"
                      />
                    </Field>

                    <button
                      type="submit"
                      disabled={submitting || filteredItems.length === 0}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting && (
                        <Loader2 size={18} className="animate-spin" />
                      )}
                      {submitting
                        ? "Sending Request..."
                        : "Submit Reservation Request"}
                    </button>

                    <p className="text-center text-xs leading-6 text-white/45">
                      This creates a pending request. The location will confirm
                      or follow up from their RoseOut portal.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.35);
          padding: 0.9rem 1rem;
          color: white;
          outline: none;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .input:focus {
          border-color: rgba(248, 113, 113, 0.65);
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.18);
        }

        .input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }

        select.input option {
          background: #09090b;
          color: white;
        }
      `}</style>
    </>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/45">
        {icon}
        {label}
      </span>

      {children}
    </label>
  );
}