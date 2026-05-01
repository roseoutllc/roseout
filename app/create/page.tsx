"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase-browser";
import { clampScore } from "@/lib/clampScore";
import ScoreBadge from "@/components/ScoreBadge";

type LocationType = "restaurant" | "activity";

type LocationItem = {
  id: string;
  location_type: LocationType;
  display_name: string;
  restaurant_name?: string;
  activity_name?: string;
  address?: string;
  city?: string;
  state?: string;
  image_url?: string;
  roseout_score?: number;
  quality_score?: number;
  claim_status?: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  primary_tag?: string;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selected, setSelected] = useState<LocationItem | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "restaurant" | "activity">("all");

  useEffect(() => {
    const load = async () => {
      const { data: restaurants } = await supabase.from("restaurants").select("*");
      const { data: activities } = await supabase.from("activities").select("*");

      const combined: LocationItem[] = [
        ...(restaurants || []).map((r: any) => ({
          ...r,
          location_type: "restaurant",
          display_name: r.restaurant_name || r.name || "Unnamed Restaurant",
        })),
        ...(activities || []).map((a: any) => ({
          ...a,
          location_type: "activity",
          display_name: a.activity_name || a.name || "Unnamed Activity",
        })),
      ];

      setLocations(combined);
      setSelected(combined[0] || null);
    };

    load();
  }, [supabase]);

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const matchesType = filter === "all" || location.location_type === filter;

      const searchText = [
        location.display_name,
        location.city,
        location.state,
        location.owner_name,
        location.owner_email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [locations, search, filter]);

  const stats = useMemo(() => {
    return {
      total: locations.length,
      claimed: locations.filter((l) => l.claim_status === "claimed").length,
      unclaimed: locations.filter((l) => l.claim_status !== "claimed").length,
      restaurants: locations.filter((l) => l.location_type === "restaurant").length,
      activities: locations.filter((l) => l.location_type === "activity").length,
    };
  }, [locations]);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(225,6,42,0.24),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(225,6,42,0.16),transparent_28%),linear-gradient(180deg,#050505,#000)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-xl">
                🌹
              </div>

              <span className="text-2xl font-black">
                Rose<span className="text-[#e1062a]">Out</span>
              </span>
            </Link>

            <div className="hidden items-center gap-6 text-sm font-bold text-white/60 md:flex">
              <Link href="/admin/dashboard" className="hover:text-white">
                Dashboard
              </Link>
              <Link href="/admin/restaurants" className="hover:text-white">
                Restaurants
              </Link>
              <Link href="/admin/activities" className="hover:text-white">
                Activities
              </Link>
              <Link href="/admin/users" className="hover:text-white">
                Users
              </Link>
            </div>

            <Link
              href="/admin/dashboard"
              className="rounded-2xl bg-[#e1062a] px-5 py-2 text-sm font-black text-white shadow-lg shadow-red-500/25 transition hover:bg-red-500"
            >
              Admin Home
            </Link>
          </div>

          <div className="grid gap-8 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-red-500">
                RoseOut Control Room
              </p>

              <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                Locations
                <br />
                <span className="text-[#e1062a]">Dashboard.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/55">
                View, manage, claim, and edit restaurants and activities in one
                premium RoseOut command center.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Total" value={stats.total} />
              <Stat label="Claimed" value={stats.claimed} />
              <Stat label="Unclaimed" value={stats.unclaimed} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-3 shadow-2xl shadow-black/30">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search locations, city, owner, email..."
              className="w-full rounded-2xl border border-white/10 bg-black px-5 py-4 text-sm font-bold text-white outline-none placeholder:text-white/35 focus:border-red-500/60"
            />
          </div>

          <div className="flex gap-2 rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </FilterButton>
            <FilterButton
              active={filter === "restaurant"}
              onClick={() => setFilter("restaurant")}
            >
              Restaurants
            </FilterButton>
            <FilterButton
              active={filter === "activity"}
              onClick={() => setFilter("activity")}
            >
              Activities
            </FilterButton>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="max-h-[82vh] space-y-3 overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-4 shadow-2xl shadow-black/30">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500">
                Locations
              </p>

              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/50">
                {filteredLocations.length}
              </span>
            </div>

            {filteredLocations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm font-bold text-white/40">
                No locations found.
              </div>
            ) : (
              filteredLocations.map((loc) => {
                const score = clampScore(loc.roseout_score ?? loc.quality_score ?? 0);
                const active = selected?.id === loc.id;

                return (
                  <button
                    key={`${loc.location_type}-${loc.id}`}
                    onClick={() => setSelected(loc)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-red-500/60 bg-red-500/10"
                        : "border-white/10 bg-black/35 hover:border-red-500/40 hover:bg-red-500/10"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/10">
                        {loc.image_url ? (
                          <Image
                            src={loc.image_url}
                            alt={loc.display_name}
                            width={100}
                            height={100}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl">
                            {loc.location_type === "restaurant" ? "🍽️" : "🎟️"}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-black">
                            {loc.display_name}
                          </p>

                          <span className="rounded-full bg-[#e1062a] px-2 py-0.5 text-[10px] font-black text-white">
                            {score}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs font-bold capitalize text-white/40">
                          {loc.location_type}
                        </p>

                        <p className="mt-1 truncate text-xs text-white/35">
                          {[loc.city, loc.state].filter(Boolean).join(", ") ||
                            "No location"}
                        </p>

                        <span
                          className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                            loc.claim_status === "claimed"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-white/10 text-white/45"
                          }`}
                        >
                          {loc.claim_status === "claimed" ? "Claimed" : "Unclaimed"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </aside>

          <section className="min-h-[680px] rounded-[2.5rem] border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl shadow-black/30">
            {selected ? (
              <SelectedLocationPanel selected={selected} />
            ) : (
              <div className="flex min-h-[600px] items-center justify-center text-center">
                <div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl">
                    🌹
                  </div>
                  <h2 className="mt-5 text-3xl font-black">Select a location</h2>
                  <p className="mt-2 text-sm text-white/40">
                    Choose a restaurant or activity to view details.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function SelectedLocationPanel({ selected }: { selected: LocationItem }) {
  const score = clampScore(selected.roseout_score ?? selected.quality_score ?? 0);

  return (
    <div>
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black">
        {selected.image_url ? (
          <Image
            src={selected.image_url}
            alt={selected.display_name}
            width={1200}
            height={520}
            className="h-[320px] w-full object-cover opacity-80"
          />
        ) : (
          <div className="flex h-[320px] w-full items-center justify-center bg-gradient-to-br from-red-500/20 to-black text-6xl">
            {selected.location_type === "restaurant" ? "🍽️" : "🎟️"}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">
            {selected.location_type === "restaurant"
              ? "RoseOut Restaurant"
              : "RoseOut Activity"}
          </p>

          <h2 className="mt-2 max-w-3xl text-4xl font-black tracking-tight">
            {selected.display_name}
          </h2>

          <p className="mt-2 text-sm font-semibold text-white/55">
            {[selected.address, selected.city, selected.state]
              .filter(Boolean)
              .join(", ") || "Address not listed"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500">
              RoseOut Score
            </p>

            <div className="mt-4">
              <ScoreBadge score={score} />
            </div>

            {selected.primary_tag && (
              <p className="mt-4 text-lg font-black text-red-400">
                ✨ {selected.primary_tag}
              </p>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500">
              Owner Info
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <DetailBox label="Name" value={selected.owner_name || "Not set"} />
              <DetailBox
                label="Email"
                value={
                  selected.owner_email ? maskEmail(selected.owner_email) : "Not set"
                }
              />
              <DetailBox label="Phone" value={selected.owner_phone || "Not set"} />
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-black">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
              Claim QR
            </p>

            <QRPanel id={selected.id} />

            <p className="mt-4 text-xs leading-5 text-neutral-500">
              Print or send this QR code so owners can claim their listing.
            </p>
          </div>

          <Link
            href={`/locations/edit/${selected.location_type}s/${selected.id}`}
            className="flex w-full justify-center rounded-2xl bg-[#e1062a] px-6 py-4 text-sm font-black text-white shadow-lg shadow-red-500/25 transition hover:bg-red-500"
          >
            Edit Location
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl shadow-black/30">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-4xl font-black">{value}</p>
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-black transition ${
        active
          ? "bg-[#e1062a] text-white"
          : "text-white/50 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/35">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-white">{value}</p>
    </div>
  );
}

function QRPanel({ id }: { id: string }) {
  const [qr, setQr] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/claim?id=${id}`;
    QRCode.toDataURL(url).then(setQr);
  }, [id]);

  return (
    <div className="mt-4">
      {qr ? (
        <img
          src={qr}
          alt="Claim QR"
          className="mx-auto h-44 w-44 rounded-2xl bg-white p-2"
        />
      ) : (
        <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-neutral-100 text-sm font-bold text-neutral-400">
          Loading QR...
        </div>
      )}
    </div>
  );
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;

  return name[0] + "***@" + domain;
}