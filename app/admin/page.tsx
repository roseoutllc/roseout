"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

type ClaimStatus = "pending" | "rejected" | "unclaimed" | "claimed";
type FilterStatus = "all" | ClaimStatus;
type ActiveTab = "restaurants" | "activities";

export default function AdminPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("restaurants");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");

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

    const [r, a] = await Promise.all([
      supabase
        .from("restaurants")
        .select(`*, restaurant_claims(*)`)
        .order("created_at", { ascending: false }),

      supabase
        .from("activities")
        .select(`*, activity_claims(*)`)
        .order("created_at", { ascending: false }),
    ]);

    setRestaurants(r.data || []);
    setActivities(a.data || []);
    setLoading(false);
  };

  const getClaimStatus = (item: any, key: string): ClaimStatus => {
    const claims = item[key] || [];

    if (claims.some((c: any) => c.status === "pending")) return "pending";
    if (claims.some((c: any) => ["claimed", "approved", "completed"].includes(c.status))) return "claimed";
    if (claims.some((c: any) => c.status === "rejected")) return "rejected";

    return "unclaimed";
  };

  const getPendingClaim = (item: any, key: string) =>
    item[key]?.find((c: any) => c.status === "pending");

  const updateClaim = async (id: string, table: string, status: string) => {
    await supabase.from(table).update({ status }).eq("id", id);
    fetchData();
  };

  const items = activeTab === "restaurants" ? restaurants : activities;
  const claimKey =
    activeTab === "restaurants" ? "restaurant_claims" : "activity_claims";

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const status = getClaimStatus(item, claimKey);
      const name =
        item.restaurant_name ||
        item.activity_name ||
        item.name ||
        "";

      const matchSearch = name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || status === filter;

      return matchSearch && matchFilter;
    });
  }, [items, search, filter, activeTab]);

  const stats = {
    total: items.length,
    claimed: items.filter((i) => getClaimStatus(i, claimKey) === "claimed").length,
    pending: items.filter((i) => getClaimStatus(i, claimKey) === "pending").length,
    unclaimed: items.filter((i) => getClaimStatus(i, claimKey) === "unclaimed").length,
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (unauthorized) return <div className="p-6 text-red-400">Not authorized</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminTopBar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setActiveTab("restaurants")}
            className={`px-4 py-2 rounded-full ${
              activeTab === "restaurants" ? "bg-yellow-500 text-black" : "bg-white/10"
            }`}
          >
            Restaurants
          </button>

          <button
            onClick={() => setActiveTab("activities")}
            className={`px-4 py-2 rounded-full ${
              activeTab === "activities" ? "bg-yellow-500 text-black" : "bg-white/10"
            }`}
          >
            Activities
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-white text-black p-4 rounded-xl">
            Total: {stats.total}
          </div>
          <div className="bg-white text-black p-4 rounded-xl">
            Claimed: {stats.claimed}
          </div>
          <div className="bg-white text-black p-4 rounded-xl">
            Pending: {stats.pending}
          </div>
          <div className="bg-white text-black p-4 rounded-xl">
            Unclaimed: {stats.unclaimed}
          </div>
        </div>

        {/* Search */}
        <input
          className="mt-6 w-full p-3 rounded-xl bg-black border border-white/20"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Listings */}
        <div className="mt-6 space-y-4">
          {filtered.map((item) => {
            const status = getClaimStatus(item, claimKey);
            const pending = getPendingClaim(item, claimKey);

            return (
              <div key={item.id} className="bg-white text-black p-5 rounded-xl">
                <div className="flex justify-between">
                  <div>
                    <Link
                      href={`/admin/${activeTab}/${item.id}`}
                      className="font-bold text-lg"
                    >
                      {item.restaurant_name || item.activity_name}
                    </Link>

                    <p className="text-sm text-gray-500">
                      {item.address || "No address"}
                    </p>

                    <span className="mt-2 inline-block px-3 py-1 rounded-full bg-gray-800 text-white text-sm">
                      {status}
                    </span>
                  </div>

                  {pending && (
                    <div className="text-sm">
                      <p>{pending.owner_name}</p>
                      <p>{pending.owner_email}</p>

                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() =>
                            updateClaim(
                              pending.id,
                              claimKey,
                              "claimed"
                            )
                          }
                          className="bg-green-600 px-3 py-1 text-white rounded"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            updateClaim(
                              pending.id,
                              claimKey,
                              "rejected"
                            )
                          }
                          className="bg-red-600 px-3 py-1 text-white rounded"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}