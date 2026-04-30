"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

type LocationType = "all" | "restaurants" | "activities";
type ClaimStatus = "pending" | "rejected" | "unclaimed" | "claimed";
type ClaimFilter = "all" | ClaimStatus;

export default function AdminPage() {
  const supabase = createClient();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [locationType, setLocationType] = useState<LocationType>("all");
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      if (data.user.user_metadata?.role !== "superuser") {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      await fetchData();
    };

    init();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [restaurantResult, activityResult] = await Promise.all([
      supabase
        .from("restaurants")
        .select(`*, restaurant_claims(*)`)
        .order("created_at", { ascending: false }),

      supabase
        .from("activities")
        .select(`*, activity_claims(*)`)
        .order("created_at", { ascending: false }),
    ]);

    setRestaurants(restaurantResult.data || []);
    setActivities(activityResult.data || []);
    setLoading(false);
  };

  const getClaimStatus = (claims: any[] = []): ClaimStatus => {
    if (claims.some((c) => c.status === "pending")) return "pending";
    if (claims.some((c) => ["claimed", "approved", "completed"].includes(c.status))) return "claimed";
    if (claims.some((c) => c.status === "rejected")) return "rejected";
    return "unclaimed";
  };

  const allLocations = useMemo(() => {
    const restaurantLocations = restaurants.map((r) => ({
      ...r,
      location_type: "restaurants",
      display_type: "Restaurant",
      display_name: r.restaurant_name || r.name || "Unnamed Restaurant",
      display_address:
        [r.address, r.city, r.state, r.zip_code].filter(Boolean).join(", ") ||
        "No address listed",
      edit_path: `/admin/restaurants/${r.id}`,
      claim_url: r.claim_url || `/claim-restaurant/${r.id}`,
      claims: r.restaurant_claims || [],
    }));

    const activityLocations = activities.map((a) => ({
      ...a,
      location_type: "activities",
      display_type: "Activity Location",
      display_name: a.activity_name || a.name || "Unnamed Activity",
      display_address:
        [a.address, a.city, a.state, a.zip_code].filter(Boolean).join(", ") ||
        "No address listed",
      edit_path: `/admin/activities/${a.id}`,
      claim_url: a.claim_url || `/claim-activities/${a.id}`,
      claims: a.activity_claims || [],
    }));

    return [...restaurantLocations, ...activityLocations];
  }, [restaurants, activities]);

  const filteredLocations = useMemo(() => {
    return allLocations.filter((location) => {
      const status = getClaimStatus(location.claims);
      const query = search.toLowerCase();

      return (
        (locationType === "all" || location.location_type === locationType) &&
        (claimFilter === "all" || status === claimFilter) &&
        (location.display_name.toLowerCase().includes(query) ||
          location.display_address.toLowerCase().includes(query))
      );
    });
  }, [allLocations, locationType, claimFilter, search]);

  const stats = {
    total: allLocations.length,
    restaurants: allLocations.filter((l) => l.location_type === "restaurants").length,
    activities: allLocations.filter((l) => l.location_type === "activities").length,
    pending: allLocations.filter((l) => getClaimStatus(l.claims) === "pending").length,
    claimed: allLocations.filter((l) => getClaimStatus(l.claims) === "claimed").length,
    unclaimed: allLocations.filter((l) => getClaimStatus(l.claims) === "unclaimed").length,
  };

  if (loading) return <div className="p-6">Loading admin dashboard...</div>;
  if (unauthorized) return <div className="p-6 text-red-400">Not authorized</div>;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 text-white">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-500">
        RoseOut Admin
      </p>

      <h1 className="mt-2 text-4xl font-bold">All Locations</h1>

      <p className="mt-2 text-neutral-400">
        Manage restaurants, activity locations, ownership claims, and listing content in one place.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-6">
        <StatCard label="All" value={stats.total} />
        <StatCard label="Restaurants" value={stats.restaurants} />
        <StatCard label="Activities" value={stats.activities} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Claimed" value={stats.claimed} />
        <StatCard label="Unclaimed" value={stats.unclaimed} />
      </div>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all locations..."
            className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
          />

          <select
            value={locationType}
            onChange={(e) => setLocationType(e.target.value as LocationType)}
            className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
          >
            <option value="all">All Locations</option>
            <option value="restaurants">Restaurants</option>
            <option value="activities">Activity Locations</option>
          </select>

          <select
            value={claimFilter}
            onChange={(e) => setClaimFilter(e.target.value as ClaimFilter)}
            className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
          >
            <option value="all">All Claim Statuses</option>
            <option value="pending">Pending Claims</option>
            <option value="claimed">Claimed</option>
            <option value="unclaimed">Unclaimed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-3xl bg-white text-black">
        <div className="grid grid-cols-12 bg-neutral-100 px-5 py-4 text-xs font-black uppercase tracking-wide text-neutral-500">
          <div className="col-span-2">Image</div>
          <div className="col-span-4">Location</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Claim</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {filteredLocations.map((location) => {
          const status = getClaimStatus(location.claims);

          return (
            <div
              key={`${location.location_type}-${location.id}`}
              className="grid grid-cols-12 items-center gap-4 border-t px-5 py-5"
            >
              <div className="col-span-2">
                {location.image_url ? (
                  <img
                    src={location.image_url}
                    alt={location.display_name}
                    className="h-20 w-28 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-28 items-center justify-center rounded-2xl bg-neutral-200 text-xs">
                    No Image
                  </div>
                )}
              </div>

              <div className="col-span-4">
                <p className="font-black">{location.display_name}</p>
                <p className="text-sm text-neutral-500">{location.display_address}</p>
              </div>

              <div className="col-span-2">{location.display_type}</div>
              <div className="col-span-2 capitalize">{status}</div>

              <div className="col-span-2 flex justify-end gap-2">
                <Link
                  href={location.edit_path}
                  className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
                >
                  Edit
                </Link>

                <a
                  href={location.claim_url}
                  target="_blank"
                  className="rounded-full border border-black px-4 py-2 text-sm font-bold"
                >
                  Claim
                </a>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 text-black">
      <p className="text-sm font-semibold text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}