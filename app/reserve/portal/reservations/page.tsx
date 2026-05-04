"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import RoseOutHeader from "@/components/RoseOutHeader";
import { supabase } from "@/lib/supabase";

type ReservationStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed"
  | "no_show";

type Reservation = {
  id: string;
  location_id: string;
  location_type: string;
  bookable_item_name: string | null;
  bookable_item_type: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: ReservationStatus;
  special_request: string | null;
  created_at: string;
};

const statuses: ReservationStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "declined",
  "cancelled",
  "no_show",
];

function statusLabel(status: string) {
  return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function normalizeType(value: string | null) {
  const type = String(value || "restaurant").toLowerCase();
  if (type === "activities") return "activity";
  return type || "restaurant";
}

export default function ReservePortalReservationsPage() {
  const searchParams = useSearchParams();

  const locationId = searchParams.get("locationId") || "";
  const locationType = normalizeType(searchParams.get("type"));

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeStatus, setActiveStatus] = useState<ReservationStatus | "all">(
    "pending"
  );
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const filteredReservations = useMemo(() => {
    if (activeStatus === "all") return reservations;
    return reservations.filter((item) => item.status === activeStatus);
  }, [reservations, activeStatus]);

  async function loadReservations() {
    try {
      setLoading(true);
      setError("");

      if (!locationId) {
        throw new Error("Missing locationId in the URL.");
      }

      const response = await fetch(
        `/api/reserve/portal/reservations?locationId=${locationId}&type=${locationType}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load reservations.");
      }

      setReservations(data.reservations || []);
    } catch (err: any) {
      setError(err?.message || "Unable to load reservations.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(
    reservation: Reservation,
    status: ReservationStatus
  ) {
    try {
      setUpdatingId(reservation.id);
      setError("");

      const response = await fetch("/api/reserve/portal/reservations/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservation_id: reservation.id,
          location_id: reservation.location_id,
          location_type: reservation.location_type,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update reservation.");
      }

      setReservations((prev) =>
        prev.map((item) =>
          item.id === reservation.id ? data.reservation : item
        )
      );
    } catch (err: any) {
      setError(err?.message || "Unable to update reservation.");
    } finally {
      setUpdatingId("");
    }
  }

  useEffect(() => {
    loadReservations();
  }, [locationId, locationType]);

  useEffect(() => {
    if (!locationId) return;

    const channel = supabase
      .channel(`reserve-portal-${locationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "location_reservations",
          filter: `location_id=eq.${locationId}`,
        },
        () => {
          loadReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId]);

  return (
    <>
      <RoseOutHeader />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="relative overflow-hidden px-5 py-10 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(225,6,42,0.35),transparent_30%),#000]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/85 to-black" />

          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
              >
                <ArrowLeft size={16} />
                Back
              </Link>

              <button
                onClick={loadReservations}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <div className="mt-8">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">
                RoseOut Reserve Portal
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
                Realtime Reservations
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                View incoming reservation requests, confirm bookings, decline
                requests, mark completed visits, or track no-shows.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-bold text-red-100">
                {error}
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
              <StatusButton
                label="All"
                active={activeStatus === "all"}
                count={reservations.length}
                onClick={() => setActiveStatus("all")}
              />

              {statuses.map((status) => (
                <StatusButton
                  key={status}
                  label={statusLabel(status)}
                  active={activeStatus === status}
                  count={
                    reservations.filter((item) => item.status === status)
                      .length
                  }
                  onClick={() => setActiveStatus(status)}
                />
              ))}
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-xl sm:p-6">
              {loading ? (
                <div className="flex min-h-[360px] items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="mx-auto animate-spin text-red-400" />
                    <p className="mt-4 text-sm font-bold text-white/60">
                      Loading reservations...
                    </p>
                  </div>
                </div>
              ) : filteredReservations.length === 0 ? (
                <div className="flex min-h-[360px] items-center justify-center text-center">
                  <div>
                    <CalendarDays className="mx-auto text-white/30" size={44} />
                    <h2 className="mt-4 text-2xl font-black">
                      No reservations found.
                    </h2>
                    <p className="mt-2 text-sm text-white/50">
                      New RoseOut Reserve requests will appear here in realtime.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredReservations.map((reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      updating={updatingId === reservation.id}
                      onUpdate={updateStatus}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function StatusButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border px-4 py-4 text-left transition ${
        active
          ? "border-red-400 bg-red-600 text-white"
          : "border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-2 text-2xl font-black">{count}</p>
    </button>
  );
}

function ReservationCard({
  reservation,
  updating,
  onUpdate,
}: {
  reservation: Reservation;
  updating: boolean;
  onUpdate: (reservation: Reservation, status: ReservationStatus) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-5">
      <div className="flex flex-col justify-between gap-5 lg:flex-row">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
              {statusLabel(reservation.status)}
            </span>

            {reservation.bookable_item_name && (
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/65">
                {reservation.bookable_item_name}
              </span>
            )}
          </div>

          <h2 className="mt-4 text-2xl font-black">
            {reservation.customer_name}
          </h2>

          <div className="mt-4 grid gap-3 text-sm font-bold text-white/65 sm:grid-cols-3">
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={16} />
              {reservation.reservation_date}
            </span>

            <span className="inline-flex items-center gap-2">
              <Clock size={16} />
              {reservation.reservation_time}
            </span>

            <span className="inline-flex items-center gap-2">
              <Users size={16} />
              {reservation.party_size} guests
            </span>
          </div>

          <div className="mt-4 text-sm leading-7 text-white/55">
            {reservation.customer_phone && (
              <p>Phone: {reservation.customer_phone}</p>
            )}
            {reservation.customer_email && (
              <p>Email: {reservation.customer_email}</p>
            )}
            {reservation.special_request && (
              <p className="mt-2 text-white/70">
                Request: {reservation.special_request}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:max-w-[360px] lg:justify-end">
          <ActionButton
            label="Confirm"
            icon={<Check size={15} />}
            disabled={updating}
            onClick={() => onUpdate(reservation, "confirmed")}
          />

          <ActionButton
            label="Decline"
            icon={<X size={15} />}
            disabled={updating}
            onClick={() => onUpdate(reservation, "declined")}
          />

          <ActionButton
            label="Completed"
            disabled={updating}
            onClick={() => onUpdate(reservation, "completed")}
          />

          <ActionButton
            label="No Show"
            disabled={updating}
            onClick={() => onUpdate(reservation, "no_show")}
          />

          <ActionButton
            label="Cancel"
            disabled={updating}
            onClick={() => onUpdate(reservation, "cancelled")}
          />
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/75 transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      {label}
    </button>
  );
}