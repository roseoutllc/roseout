"use client";

import Image from "next/image";
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
};

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
          supabase.from("restaurants").select("*").order("created_at", {
            ascending: false,
          }),
          supabase.from("activities").select("*").order("created_at", {
            ascending: false,
          }),
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
        width: 280,
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

  const isClaimed =
    selected?.claimed || selected?.claim_status === "claimed" || selected?.owner_email;

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
    <main className="min-h-screen bg-black px-5 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-[#111] p-6 shadow-2xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-500">
              RoseOut
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight">
              Locations Portal
            </h1>

            <p className="mt-2 text-sm text-neutral-400">
              Manage claimed locations, review listing details, and print QR
              claim codes.
            </p>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/locations/signup";
            }}
            className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/15"
          >
            Logout
          </button>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-400">
              Total Locations
            </p>
            <p className="mt-2 text-3xl font-black">{locations.length}</p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-400">
              Claimed
            </p>
            <p className="mt-2 text-3xl font-black text-green-400">
              {claimedCount}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-400">
              Unclaimed
            </p>
            <p className="mt-2 text-3xl font-black text-yellow-500">
              {unclaimedCount}
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-[1.75rem] border border-white/10 bg-black/70 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city, or address..."
              className="rounded-full border border-white/10 bg-neutral-950 px-5 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-yellow-500"
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-full border border-white/10 bg-neutral-950 px-5 py-3 text-sm font-bold text-white outline-none"
            >
              <option value="all">All Locations</option>
              <option value="restaurant">Restaurants</option>
              <option value="activity">Activities</option>
            </select>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="space-y-4">
            {filteredLocations.map((location) => {
              const active = selected?.id === location.id;
              const claimed =
                location.claimed ||
                location.claim_status === "claimed" ||
                location.owner_email;

              return (
                <button
                  key={`${location.location_type}-${location.id}`}
                  type="button"
                  onClick={() => setSelected(location)}
                  className={`group w-full overflow-hidden rounded-[1.75rem] border text-left shadow-xl transition hover:-translate-y-1 ${
                    active
                      ? "border-yellow-500 bg-yellow-500 text-black"
                      : "border-white/10 bg-white text-black"
                  }`}
                >
                  <div className="relative h-48">
                    {location.image_url ? (
                      <Image
                        src={location.image_url}
                        alt={location.display_name}
                        fill
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-neutral-200 text-neutral-500">
                        No image
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    <div className="absolute left-4 top-4 flex gap-2">
                      <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-black uppercase text-white">
                        {location.location_type}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                          claimed
                            ? "bg-green-500 text-black"
                            : "bg-white text-black"
                        }`}
                      >
                        {claimed ? "Claimed" : "Unclaimed"}
                      </span>
                    </div>

                    {location.rating && (
                      <div className="absolute bottom-4 right-4 rounded-full bg-white px-3 py-1 text-sm font-black text-black">
                        ⭐ {location.rating}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h2 className="text-xl font-black">
                      {location.display_name}
                    </h2>

                    <p className="mt-2 text-sm opacity-70">
                      {[location.address, location.city, location.state]
                        .filter(Boolean)
                        .join(", ")}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {location.status && (
                        <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                          {location.status}
                        </span>
                      )}

                      {location.roseout_score !== undefined && (
                        <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                          {location.roseout_score}/100
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {!filteredLocations.length && (
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center">
                <p className="font-bold text-neutral-300">
                  No locations found.
                </p>
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            {selected ? (
              <div className="overflow-hidden rounded-[2rem] bg-white text-black shadow-2xl">
                <div className="relative h-72">
                  {selected.image_url ? (
                    <Image
                      src={selected.image_url}
                      alt={selected.display_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-neutral-200 text-neutral-500">
                      No image available
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  <div className="absolute bottom-5 left-5 right-5">
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

                    <h2 className="text-3xl font-black text-white">
                      {selected.display_name}
                    </h2>
                  </div>
                </div>

                <div className="grid gap-5 p-6">
                  <section>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
                      Location Details
                    </p>

                    <p className="mt-3 text-sm text-neutral-600">
                      {selectedAddress || "No address listed."}
                    </p>

                    {selected.primary_tag && (
                      <p className="mt-3 text-sm font-bold">
                        ✨ {selected.primary_tag}
                      </p>
                    )}

                    {selected.date_style_tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selected.date_style_tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-[1.5rem] bg-neutral-100 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
                      Owner Contact
                    </p>

                    <div className="mt-4 space-y-2 text-sm">
                      <p>
                        <span className="font-black">Name:</span>{" "}
                        {selected.owner_name || "Not added"}
                      </p>
                      <p>
                        <span className="font-black">Email:</span>{" "}
                        {selected.owner_email || user?.email || "Not added"}
                      </p>
                      <p>
                        <span className="font-black">Phone:</span>{" "}
                        {selected.owner_phone || "Not added"}
                      </p>
                    </div>
                  </section>

                  <section className="rounded-[1.5rem] border border-neutral-200 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
                      QR Claim Panel
                    </p>

                    <p className="mt-2 text-sm text-neutral-600">
                      Print this QR code so a location owner can claim this
                      listing.
                    </p>

                    {qrDataUrl && (
                      <div className="mt-5 flex justify-center rounded-[1.5rem] bg-white p-4 shadow-inner">
                        <img
                          src={qrDataUrl}
                          alt="Location claim QR code"
                          className="h-52 w-52"
                        />
                      </div>
                    )}

                    <p className="mt-4 break-all rounded-2xl bg-neutral-100 p-3 text-xs text-neutral-600">
                      {claimUrl}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <a
                        href={claimUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-black px-5 py-3 text-center text-sm font-bold text-white"
                      >
                        Open Claim Link
                      </a>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-full border border-black px-5 py-3 text-sm font-bold text-black"
                      >
                        Print QR
                      </button>
                    </div>
                  </section>

                  <section className="grid gap-3 sm:grid-cols-2">
                    {selected.website && (
                      <a
                        href={selected.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-black px-5 py-3 text-center text-sm font-bold text-black"
                      >
                        Website
                      </a>
                    )}

                    {(selected.reservation_url ||
                      selected.reservation_link) && (
                      <a
                        href={
                          selected.reservation_url ||
                          selected.reservation_link
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-black px-5 py-3 text-center text-sm font-bold text-white"
                      >
                        Reservation
                      </a>
                    )}
                  </section>
                </div>
              </div>
            ) : (
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center">
                <p className="font-bold text-neutral-300">
                  Select a location to view details.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}