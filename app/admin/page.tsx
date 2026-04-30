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

      fetchData();
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

    if (
      claims.some((c) =>
        ["claimed", "approved", "completed"].includes(c.status)
      )
    ) {
      return "claimed";
    }

    if (claims.some((c) => c.status === "rejected")) return "rejected";

    return "unclaimed";
  };

  const allLocations = useMemo(() => {
    const restaurantLocations = restaurants.map((r) => ({
      ...r,
      location_type: "restaurants",
      display_type: "Restaurant",
      display_name:
        r.restaurant_name || r.name || r.business_name || "Unnamed Restaurant",
      display_address:
        [r.address, r.city, r.state, r.zip_code].filter(Boolean).join(", ") ||
        r.location ||
        "No address listed",
      claim_key: "restaurant_claims",
      edit_path: `/admin/restaurants/${r.id}`,
      claim_url: r.claim_url || `/claim-restaurant/${r.id}`,
      claims: r.restaurant_claims || [],
    }));

    const activityLocations = activities.map((a) => ({
      ...a,
      location_type: "activities",
      display_type: "Activity Location",
      display_name:
        a.activity_name || a.name || a.business_name || "Unnamed Activity",
      display_address:
        [a.address, a.city, a.state, a.zip_code].filter(Boolean).join(", ") ||
        a.location ||
        "No address listed",
      claim_key: "activity_claims",
      edit_path: `/admin/activities/${a.id}`,
      claim_url: a.claim_url || `/claim-activities/${a.id}`,
      claims: a.activity_claims || [],
    }));

    return [...restaurantLocations, ...activityLocations].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [restaurants, activities]);

  const filteredLocations = useMemo(() => {
    return allLocations.filter((location) => {
      const status = getClaimStatus(location.claims);
      const query = search.toLowerCase();

      const matchesType =
        locationType === "all" || location.location_type === locationType;

      const matchesClaim = claimFilter === "all" || status === claimFilter;

      const matchesSearch =
        location.display_name.toLowerCase().includes(query) ||
        location.display_address.toLowerCase().includes(query);

      return matchesType && matchesClaim && matchesSearch;
    });
  }, [allLocations, locationType, claimFilter, search]);

  const stats = useMemo(() => {
    return {
      total: allLocations.length,
      restaurants: allLocations.filter((l) => l.location_type === "restaurants")
        .length,
      activities: allLocations.filter((l) => l.location_type === "activities")
        .length,
      pending: allLocations.filter((l) => getClaimStatus(l.claims) === "pending")
        .length,
      claimed: allLocations.filter((l) => getClaimStatus(l.claims) === "claimed")
        .length,
      unclaimed: allLocations.filter(
        (l) => getClaimStatus(l.claims) === "unclaimed"
      ).length,
    };
  }, [allLocations]);

  const updateClaim = async (
    claimId: string,
    table: "restaurant_claims" | "activity_claims",
    status: "claimed" | "rejected"
  ) => {
    const { error } = await supabase
      .from(table)
      .update({ status })
      .eq("id", claimId);

    if (error) {
      alert("Error updating claim.");
      return;
    }

    fetchData();
  };

  const badgeClass = (status: ClaimStatus) => {
    if (status === "pending") return "bg-yellow-500 text-black";
    if (status === "claimed") return "bg-blue-600 text-white";
    if (status === "rejected") return "bg-red-600 text-white";
    return "bg-neutral-700 text-white";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        
        <div className="p-6">Loading admin dashboard...</div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AdminTopBar />
        <div className="p-6 text-red-400">Not authorized</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminTopBar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-500">
            RoseOut Admin
          </p>

          <h1 className="mt-2 text-4xl font-bold">All Locations</h1>

          <p className="mt-2 text-neutral-400">
            Manage restaurants, activity locations, ownership claims, and
            listing content in one place.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-6">
          <button
            onClick={() => {
              setLocationType("all");
              setClaimFilter("all");
            }}
            className="rounded-3xl bg-white p-5 text-left text-black"
          >
            <p className="text-sm font-semibold text-neutral-500">All</p>
            <p className="mt-2 text-3xl font-black">{stats.total}</p>
          </button>

          <button
            onClick={() => setLocationType("restaurants")}
            className="rounded-3xl bg-white p-5 text-left text-black"
          >
            <p className="text-sm font-semibold text-neutral-500">
              Restaurants
            </p>
            <p className="mt-2 text-3xl font-black">{stats.restaurants}</p>
          </button>

          <button
            onClick={() => setLocationType("activities")}
            className="rounded-3xl bg-white p-5 text-left text-black"
          >
            <p className="text-sm font-semibold text-neutral-500">
              Activities
            </p>
            <p className="mt-2 text-3xl font-black">{stats.activities}</p>
          </button>

          <button
            onClick={() => setClaimFilter("pending")}
            className="rounded-3xl bg-white p-5 text-left text-black"
          >
            <p className="text-sm font-semibold text-neutral-500">Pending</p>
            <p className="mt-2 text-3xl font-black">{stats.pending}</p>
          </button>

          <button
            onClick={() => setClaimFilter("claimed")}
            className="rounded-3xl bg-white p-5 text-left text-black"
          >
            <p className="text-sm font-semibold text-neutral-500">Claimed</p>
            <p className="mt-2 text-3xl font-black">{stats.claimed}</p>
          </button>

          <button
            onClick={() => setClaimFilter("unclaimed")}
            className="rounded-3xl bg-white p-5 text-left text-black"
          >
            <p className="text-sm font-semibold text-neutral-500">
              Unclaimed
            </p>
            <p className="mt-2 text-3xl font-black">{stats.unclaimed}</p>
          </button>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all locations..."
              className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white outline-none placeholder:text-neutral-500"
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

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white">
          <div className="grid grid-cols-12 bg-neutral-100 px-5 py-4 text-xs font-black uppercase tracking-wide text-neutral-500">
            <div className="col-span-2">Image</div>
            <div className="col-span-4">Location</div>
            <div className="col-span-2 hidden md:block">Type</div>
            <div className="col-span-2 hidden md:block">Claim</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-neutral-200">
            {filteredLocations.map((location) => {
              const status = getClaimStatus(location.claims);
              const pendingClaim = location.claims.find(
                (c: any) => c.status === "pending"
              );

              return (
                <div
                  key={`${location.location_type}-${location.id}`}
                  className="grid grid-cols-12 items-center gap-4 px-5 py-5 text-black hover:bg-neutral-50"
                >
                  <div className="col-span-12 md:col-span-2">
                    {location.image_url ? (
                      <img
                        src={location.image_url}
                        alt={location.display_name}
                        className="h-20 w-28 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-28 items-center justify-center rounded-2xl bg-neutral-200 text-xs font-semibold text-neutral-500">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <Link
                      href={location.edit_path}
                      className="text-lg font-black hover:underline"
                    >
                      {location.display_name}
                    </Link>

                    <p className="mt-1 text-sm text-neutral-500">
                      {location.display_address}
                    </p>
                  </div>

                  <div className="col-span-2 hidden md:block">
                    <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                      {location.display_type}
                    </span>
                  </div>

                  <div className="col-span-2 hidden md:block">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass(
                        status
                      )}`}
                    >
                      {status === "pending"
                        ? "Pending"
                        : status === "claimed"
                        ? "Claimed"
                        : status === "rejected"
                        ? "Rejected"
                        : "Unclaimed"}
                    </span>
                  </div>

                  <div className="col-span-12 md:col-span-2">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={location.edit_path}
                        className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
                      >
                        Edit
                      </Link>

                      {location.claim_url && (
                        <a
                          href={location.claim_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-black px-4 py-2 text-sm font-bold text-black"
                        >
                          Claim
                        </a>
                      )}
                    </div>
                  </div>

                  {pendingClaim && (
                    <div className="col-span-12 rounded-2xl bg-yellow-50 p-4 text-sm">
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                          <p className="font-bold text-yellow-700">
                            Pending Claim
                          </p>
                          <p>{pendingClaim.owner_name || "No name"}</p>
                          <p className="break-all text-neutral-600">
                            {pendingClaim.owner_email}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              updateClaim(
                                pendingClaim.id,
                                location.claim_key,
                                "claimed"
                              )
                            }
                            className="rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              updateClaim(
                                pendingClaim.id,
                                location.claim_key,
                                "rejected"
                              )
                            }
                            className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredLocations.length === 0 && (
              <div className="px-5 py-12 text-center text-neutral-500">
                No locations found.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}