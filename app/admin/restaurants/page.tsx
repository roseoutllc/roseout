"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

export default function AdminRestaurantsPage() {
  const supabase = createClient();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [claimFilter, setClaimFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        window.location.href = "/login";
        return;
      }

      if (data.user.user_metadata?.role !== "superuser") {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/restaurants");
      const dataJson = await res.json();

      setRestaurants(dataJson.restaurants || []);
      setLoading(false);
    };

    init();
  }, []);

  const filteredRestaurants = useMemo(() => {
    const q = search.toLowerCase().trim();

    return restaurants.filter((r) => {
      const matchesSearch =
        !q ||
        r.restaurant_name?.toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q) ||
        r.state?.toLowerCase().includes(q) ||
        r.zip_code?.toLowerCase().includes(q);

      const matchesClaim =
        claimFilter === "all" ||
        (claimFilter === "unclaimed" && !r.claim_status) ||
        r.claim_status === claimFilter;

      const matchesStatus =
        statusFilter === "all" || r.status === statusFilter;

      return matchesSearch && matchesClaim && matchesStatus;
    });
  }, [restaurants, search, claimFilter, statusFilter]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">Loading...</main>
    );
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        Not authorized
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminTopBar />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-4xl font-bold">Manage Restaurants</h1>

        <p className="mt-3 text-neutral-400">
          Review restaurants, claim status, and listing details.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-neutral-950 p-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, address, city, state, or ZIP..."
            className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white placeholder-neutral-500 outline-none focus:border-yellow-500"
          />

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select
              value={claimFilter}
              onChange={(e) => setClaimFilter(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-yellow-500"
            >
              <option value="all">All claim statuses</option>
              <option value="unclaimed">Unclaimed</option>
              <option value="pending">Pending claims</option>
              <option value="approved">Claimed / Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-yellow-500"
            >
              <option value="all">All listing statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setClaimFilter("all");
                setStatusFilter("all");
              }}
              className="rounded-2xl bg-white px-4 py-3 font-bold text-black"
            >
              Clear Filters
            </button>
          </div>

          <p className="mt-4 text-sm text-neutral-400">
            Showing {filteredRestaurants.length} of {restaurants.length} restaurants
          </p>
        </div>

        <div className="mt-8 grid gap-4">
          {filteredRestaurants.map((r) => (
            <a
              key={r.id}
              href={`/admin/restaurants/${r.id}`}
              className="rounded-3xl border border-white/10 bg-neutral-950 p-6 text-white hover:bg-neutral-900"
            >
              <h2 className="text-2xl font-bold">
                {r.restaurant_name || "Unnamed Restaurant"}
              </h2>

              <p className="mt-2 text-sm text-neutral-400">
                {r.address || "No address listed"}
                {r.city ? `, ${r.city}` : ""}
                {r.state ? `, ${r.state}` : ""} {r.zip_code || ""}
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-black">
                  {r.status || "approved"}
                </span>

                <span
                  className={`rounded-full px-3 py-1 font-semibold ${
                    r.claim_status === "pending"
                      ? "bg-yellow-500 text-black"
                      : r.claim_status === "approved"
                      ? "bg-green-600 text-white"
                      : r.claim_status === "rejected"
                      ? "bg-red-600 text-white"
                      : "bg-slate-600 text-white"
                  }`}
                >
                  {r.claim_status || "unclaimed"}
                </span>

                {r.is_featured && (
                  <span className="rounded-full bg-yellow-500 px-3 py-1 font-semibold text-black">
                    Featured
                  </span>
                )}
              </div>
            </a>
          ))}

          {filteredRestaurants.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-neutral-950 p-6 text-neutral-400">
              No restaurants match your filters.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}