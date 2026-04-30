"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminPage() {
  const supabase = createClient();

  const [locations, setLocations] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [claimFilter, setClaimFilter] = useState("all");

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

      const res = await fetch("/api/admin/locations");
      const dataJson = await res.json();

      const combined = dataJson.locations || [];

      setLocations(combined);
      setFiltered(combined);
      setLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    let result = [...locations];

    if (search) {
      result = result.filter((l) =>
        l.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((l) => l.type === typeFilter);
    }

    if (claimFilter !== "all") {
      result = result.filter((l) => l.claim_status === claimFilter);
    }

    setFiltered(result);
  }, [search, typeFilter, claimFilter, locations]);

  if (loading) {
    return <div className="p-6">Loading admin dashboard...</div>;
  }

  if (unauthorized) {
    return <div className="p-6 text-red-400">Not authorized</div>;
  }

  const stats = {
    all: locations.length,
    restaurants: locations.filter((l) => l.type === "restaurant").length,
    activities: locations.filter((l) => l.type === "activity").length,
    pending: locations.filter((l) => l.claim_status === "pending").length,
    claimed: locations.filter((l) => l.claim_status === "approved").length,
    unclaimed: locations.filter((l) => l.claim_status === "unclaimed").length,
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 text-white">
      {/* Header */}
      <div>
        <p className="text-xs tracking-widest text-yellow-500">
          ROSEOUT ADMIN
        </p>

        <h1 className="mt-2 text-4xl font-bold">All Locations</h1>

        <p className="mt-2 text-neutral-400">
          Manage restaurants, activity locations, ownership claims, and listing
          content in one place.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 md:grid-cols-6">
        <StatCard label="All" value={stats.all} />
        <StatCard label="Restaurants" value={stats.restaurants} />
        <StatCard label="Activities" value={stats.activities} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Claimed" value={stats.claimed} />
        <StatCard label="Unclaimed" value={stats.unclaimed} />
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 p-4 md:flex-row">
        <input
          className="flex-1 rounded-xl bg-black px-4 py-3 outline-none"
          placeholder="Search all locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="rounded-xl bg-black px-4 py-3"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="restaurant">Restaurants</option>
          <option value="activity">Activity Locations</option>
        </select>

        <select
          className="rounded-xl bg-black px-4 py-3"
          value={claimFilter}
          onChange={(e) => setClaimFilter(e.target.value)}
        >
          <option value="all">All Claim Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Claimed</option>
          <option value="unclaimed">Unclaimed</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-8 overflow-hidden rounded-3xl bg-white text-black">
        <div className="grid grid-cols-6 px-6 py-4 text-sm font-bold text-neutral-500">
          <span>Image</span>
          <span className="col-span-2">Location</span>
          <span>Type</span>
          <span>Claim</span>
          <span>Actions</span>
        </div>

        {filtered.map((l) => (
          <div
            key={l.id}
            className="grid grid-cols-6 items-center border-t px-6 py-4"
          >
            <img
              src={l.image_url || "/placeholder.png"}
              className="h-14 w-14 rounded-xl object-cover"
            />

            <div className="col-span-2">
              <p className="font-bold">{l.name}</p>
              <p className="text-sm text-neutral-500">
                {l.address}, {l.city}
              </p>
            </div>

            <span className="text-sm">
              {l.type === "restaurant" ? "Restaurant" : "Activity Location"}
            </span>

            <span className="text-sm">{l.claim_status}</span>

            <div className="flex gap-2">
              <a
                href={
                  l.type === "restaurant"
                    ? `/admin/restaurants/${l.id}`
                    : `/admin/activities/${l.id}`
                }
                className="rounded-full bg-black px-4 py-1 text-white"
              >
                Edit
              </a>

              <a
                href={
                  l.type === "restaurant"
                    ? `/claim-restaurant/${l.id}`
                    : `/claim-activities/${l.id}`
                }
                className="rounded-full border px-4 py-1"
              >
                Claim
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function StatCard({ label, value }: any) {
  return (
    <div className="rounded-2xl bg-white p-6 text-black">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}