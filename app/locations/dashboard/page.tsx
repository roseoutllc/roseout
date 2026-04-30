"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase-browser";

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
  zip_code?: string;
  image_url?: string;
  rating?: number;
  review_count?: number;
  roseout_score?: number;
  quality_score?: number;
  status?: string;
  claimed?: boolean;
  claim_status?: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  website?: string;
  reservation_url?: string;
  reservation_link?: string;
  primary_tag?: string;
  date_style_tags?: string[];
  created_at?: string;
};

function StatCard({
  icon,
  label,
  value,
  sub,
  green,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub: string;
  green?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 shadow-2xl">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black ${
            green
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-500"
          }`}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs font-black text-white">{label}</p>
          <p className="mt-1 text-3xl font-black">{value}</p>
          <p className="text-xs text-white/50">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold capitalize text-white">{value}</p>
    </div>
  );
}

export default function LocationsDashboardPage() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selected, setSelected] = useState<LocationItem | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | LocationType>("all");
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/locations/signup";
        return;
      }

      setUser(user);

      const isAdmin = user.user_metadata?.role === "superuser";

      if (isAdmin) {
        const [restaurantsRes, activitiesRes] = await Promise.all([
          supabase
            .from("restaurants")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("activities")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

        const combined: LocationItem[] = [
          ...(restaurantsRes.data || []).map((r: any) => ({
            ...r,
            location_type: "restaurant" as LocationType,
            display_name: r.restaurant_name || "Restaurant",
          })),
          ...(activitiesRes.data || []).map((a: any) => ({
            ...a,
            location_type: "activity" as LocationType,
            display_name: a.activity_name || "Activity",
          })),
        ];

        setLocations(combined);
        setSelected(combined[0] || null);
        setLoading(false);
        return;
      }

      const { data: ownerLinks } = await supabase
        .from("restaurant_owners")
        .select("*")
        .eq("user_id", user.id);

      const restaurantIds =
        ownerLinks?.map((o: any) => o.restaurant_id).filter(Boolean) || [];

      const activityIds =
        ownerLinks?.map((o: any) => o.activity_id).filter(Boolean) || [];

      const [restaurantsRes, activitiesRes] = await Promise.all([
        restaurantIds.length
          ? supabase.from("restaurants").select("*").in("id", restaurantIds)
          : Promise.resolve({ data: [] as any[] }),
        activityIds.length
          ? supabase.from("activities").select("*").in("id", activityIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const combined: LocationItem[] = [
        ...(restaurantsRes.data || []).map((r: any) => ({
          ...r,
          location_type: "restaurant" as LocationType,
          display_name: r.restaurant_name || "Restaurant",
        })),
        ...(activitiesRes.data || []).map((a: any) => ({
          ...a,
          location_type: "activity" as LocationType,
          display_name: a.activity_name || "Activity",
        })),
      ];

      setLocations(combined);
      setSelected(combined[0] || null);
      setLoading(false);
    };

    loadDashboard();
  }, [supabase]);

  useEffect(() => {
    const makeQr = async () => {
      if (!selected) {
        setQrDataUrl("");
        return;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://roseout.vercel.app";

      const claimUrl = `${baseUrl}/claim?location=${selected.id}&type=${selected.location_type}`;

      const qr = await QRCode.toDataURL(claimUrl, {
        margin: 2,
        width: 320,
      });

      setQrDataUrl(qr);
    };

    makeQr();
  }, [selected]);

  const filteredLocations = useMemo(() => {
    const q = search.toLowerCase();

    return locations.filter((location) => {
      const matchesType =
        typeFilter === "all" || location.location_type === typeFilter;

      const matchesSearch =
        location.display_name?.toLowerCase().includes(q) ||
        location.city?.toLowerCase().includes(q) ||
        location.address?.toLowerCase().includes(q);

      return matchesType && matchesSearch;
    });
  }, [locations, search, typeFilter]);

  const claimedCount = locations.filter(
    (l) => l.claimed || l.claim_status === "claimed" || l.owner_email
  ).length;

  const unclaimedCount = locations.length - claimedCount;

  const avgScore =
    locations.length > 0
      ? Math.round(
          locations.reduce(
            (sum, l) => sum + (l.roseout_score ?? l.quality_score ?? 0),
            0
          ) / locations.length
        )
      : 0;

  const isClaimed =
    selected?.claimed ||
    selected?.claim_status === "claimed" ||
    !!selected?.owner_email;

  const selectedScore = selected?.roseout_score ?? selected?.quality_score ?? 0;

  const selectedAddress = selected
    ? [selected.address, selected.city, selected.state, selected.zip_code]
        .filter(Boolean)
        .join(", ")
    : "";

  const claimUrl = selected
    ? `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://roseout.vercel.app"
      }/claim?location=${selected.id}&type=${selected.location_type}`
    : "";

  const dateAdded = selected?.created_at
    ? new Date(selected.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not listed";

  const editUrl = selected
    ? `/locations/edit/${
        selected.location_type === "activity" ? "activities" : "restaurants"
      }/${selected.id}`
    : "#";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-500">
          Loading Locations Portal...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/95 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-3xl font-black tracking-tight text-yellow-500">
              ROSEOUT
            </p>
            <p className="hidden text-xs font-black uppercase tracking-[0.25em] text-white/80 sm:block">
              Locations Portal
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white/80 md:block">
              ? Help Center
            </button>

            <div className="flex items-center gap-3 rounded-xl border border-white/15 px-4 py-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 font-black text-black">
                {(user?.email || "U").charAt(0).toUpperCase()}
              </span>
              <span className="hidden text-sm font-bold md:block">
                {user?.email?.split("@")[0] || "Account"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-6">
        <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <StatCard
            icon="▦"
            label="Total Locations"
            value={locations.length}
            sub="All restaurants & activities"
          />

          <StatCard
            icon="✓"
            label="Claimed"
            value={claimedCount}
            sub={`${
              locations.length
                ? Math.round((claimedCount / locations.length) * 100)
                : 0
            }% of all locations`}
            green
          />

          <StatCard
            icon="◷"
            label="Unclaimed"
            value={unclaimedCount}
            sub={`${
              locations.length
                ? Math.round((unclaimedCount / locations.length) * 100)
                : 0
            }% of all locations`}
          />

          <StatCard
            icon="★"
            label="Avg. RoseOut Score"
            value={`${avgScore} /100`}
            sub="Across all locations"
          />

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/locations/signup";
            }}
            className="rounded-xl bg-yellow-500 px-7 py-4 font-black text-black shadow-[0_0_35px_rgba(234,179,8,0.25)] transition hover:bg-yellow-400"
          >
            ↪ Logout
          </button>
        </section>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="min-w-0">
            <div className="mb-4 rounded-2xl border border-white/10 bg-[#080808] p-3 shadow-2xl">
              <div className="grid gap-3 md:grid-cols-[1fr_120px_90px] lg:grid-cols-[1fr_115px_84px]">
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search locations..."
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 pr-10 text-sm text-white placeholder-white/40 outline-none focus:border-yellow-500"
                  />
                  <span className="absolute right-4 top-3 text-white/50">
                    ⌕
                  </span>
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="rounded-xl border border-white/10 bg-black px-3 py-3 text-sm font-bold text-white outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="restaurant">Restaurants</option>
                  <option value="activity">Activities</option>
                </select>

                <button className="rounded-xl border border-white/10 bg-black px-3 py-3 text-sm font-bold text-white">
                  Filters
                </button>
              </div>
            </div>

            <div className="h-[calc(100vh-260px)] space-y-3 overflow-y-auto pr-2">
              {filteredLocations.map((location) => {
                const active =
                  selected?.id === location.id &&
                  selected?.location_type === location.location_type;

                const claimed =
                  location.claimed ||
                  location.claim_status === "claimed" ||
                  !!location.owner_email;

                const score = location.roseout_score ?? location.quality_score ?? 0;

                return (
                  <button
                    key={`${location.location_type}-${location.id}`}
                    type="button"
                    onClick={() => setSelected(location)}
                    className={`group grid w-full grid-cols-[130px_1fr_54px] gap-3 rounded-2xl border p-2 text-left transition duration-300 hover:-translate-y-0.5 ${
                      active
                        ? "border-yellow-500 bg-[#151515] shadow-[0_0_0_1px_rgba(234,179,8,0.6)]"
                        : "border-white/10 bg-[#101010] hover:border-white/25"
                    }`}
                  >
                    <div className="relative h-24 overflow-hidden rounded-xl">
                      {location.image_url ? (
                        <Image
                          src={location.image_url}
                          alt={location.display_name}
                          fill
                          className="object-cover transition duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-neutral-800 text-xs text-white/40">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 py-1">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-black uppercase text-white">
                          {location.location_type}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                            claimed
                              ? "bg-green-500 text-black"
                              : "bg-yellow-500 text-black"
                          }`}
                        >
                          {claimed ? "Claimed" : "Unclaimed"}
                        </span>
                      </div>

                      <h3 className="truncate text-lg font-black text-white">
                        {location.display_name}
                      </h3>

                      <p className="mt-1 truncate text-xs text-white/60">
                        {[location.address, location.city, location.state]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between py-1">
                      {location.rating && (
                        <p className="text-xs font-black text-yellow-500">
                          ★ {location.rating}
                        </p>
                      )}

                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-yellow-500 bg-black text-[10px] font-black text-white">
                        {score}
                      </div>
                    </div>
                  </button>
                );
              })}

              {!filteredLocations.length && (
                <div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-center">
                  <p className="font-bold text-white/60">No locations found.</p>
                </div>
              )}
            </div>
          </aside>

          <section className="min-w-0">
            {selected ? (
              <div className="rounded-[2rem] border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl">
                <div className="group relative h-[350px] overflow-hidden rounded-[1.5rem] border border-white/10">
                  {selected.image_url ? (
                    <Image
                      src={selected.image_url}
                      alt={selected.display_name}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105 group-hover:blur-[1px]"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-neutral-800 text-white/50">
                      No image available
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                  <div className="absolute right-5 top-5 flex gap-2">
                    <Link
                      href={editUrl}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur transition hover:bg-yellow-500 hover:text-black"
                      title="Edit Listing"
                    >
                      ✎
                    </Link>

                    <button className="flex h-11 w-11 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur">
                      ⋮
                    </button>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-black uppercase text-white">
                        {selected.location_type}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                          isClaimed
                            ? "bg-green-500 text-black"
                            : "bg-yellow-500 text-black"
                        }`}
                      >
                        {isClaimed ? "Claimed" : "Unclaimed"}
                      </span>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                      <h2 className="text-4xl font-black text-white">
                        {selected.display_name}
                      </h2>

                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-yellow-500 bg-black text-center text-lg font-black text-white">
                        <span>
                          {selectedScore}
                          <br />
                          <span className="text-xs">/100</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
                  <section className="rounded-[1.5rem] border border-white/10 bg-[#111] p-5">
                    <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-white/50">
                      ⌖ Location Details
                    </p>

                    <p className="text-sm text-white/70">
                      {selectedAddress || "No address listed."}
                    </p>

                    {selected.primary_tag && (
                      <p className="mt-5 text-sm font-black text-white">
                        ✨ {selected.primary_tag}
                      </p>
                    )}

                    {selected.date_style_tags?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selected.date_style_tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white/80"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-white/50">
                        Owner Contact
                      </p>

                      <div className="space-y-2 text-sm text-white/80">
                        <p>
                          <span className="font-black text-white">Name:</span>{" "}
                          {selected.owner_name || "Not added"}
                        </p>
                        <p>
                          <span className="font-black text-white">Email:</span>{" "}
                          {selected.owner_email || "Not added"}
                        </p>
                        <p>
                          <span className="font-black text-white">Phone:</span>{" "}
                          {selected.owner_phone || "Not added"}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[1.5rem] border border-white/10 bg-[#111] p-5">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-white/50">
                      ▦ QR Claim Panel
                    </p>

                    <p className="text-sm text-white/65">
                      Print this QR code so a location owner can claim this
                      listing.
                    </p>

                    {qrDataUrl && (
                      <div className="mt-4 flex justify-center rounded-2xl border border-white/10 bg-white p-5">
                        <img
                          src={qrDataUrl}
                          alt="Location claim QR code"
                          className="h-52 w-52"
                        />
                      </div>
                    )}

                    <p className="mt-4 break-all rounded-xl bg-white/10 p-3 text-xs text-white/60">
                      {claimUrl}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <a
                        href={claimUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-yellow-500 px-5 py-3 text-center text-sm font-black text-black"
                      >
                        Open Claim Link ↗
                      </a>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-xl border border-white/20 px-5 py-3 text-sm font-black text-white"
                      >
                        Print QR
                      </button>
                    </div>
                  </section>
                </div>

                <section className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#111] p-5">
                  <div className="grid gap-4 md:grid-cols-4">
                    <MetaItem label="Type" value={selected.location_type} />
                    <MetaItem
                      label="Status"
                      value={isClaimed ? "Claimed" : "Unclaimed"}
                    />
                    <MetaItem label="Date Added" value={dateAdded} />
                    <MetaItem
                      label="RoseOut Score"
                      value={`${selectedScore} / 100`}
                    />
                  </div>

                  <div className="mt-5 border-t border-white/10 pt-5">
                    <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-white/50">
                      Quick Actions
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <Link
                        href={editUrl}
                        className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white/80 transition hover:border-yellow-500 hover:text-yellow-500"
                      >
                        ✎ Edit Listing
                      </Link>

                      <button className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/80">
                        ◉ View Public Listing
                      </button>

                      {(selected.reservation_url ||
                        selected.reservation_link) && (
                        <a
                          href={
                            selected.reservation_url ||
                            selected.reservation_link
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white/80"
                        >
                          ▣ Reservation
                        </a>
                      )}

                      {selected.website && (
                        <a
                          href={selected.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white/80"
                        >
                          ◎ Website
                        </a>
                      )}

                      <button className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/80">
                        ⤴ Share
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center">
                <p className="font-bold text-white/60">
                  Select a location to view details.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}