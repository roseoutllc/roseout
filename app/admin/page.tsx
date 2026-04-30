"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

type ClaimStatus = "pending" | "rejected" | "unclaimed" | "claimed";
type FilterStatus = "all" | ClaimStatus;

export default function AdminRestaurantsPage() {
  const supabase = createClient();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");

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

      fetchRestaurants();
    };

    init();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("restaurants")
      .select(
        `
        *,
        restaurant_claims (
          id,
          status,
          owner_name,
          owner_email,
          owner_phone,
          created_at
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading restaurants:", error);
      setRestaurants([]);
    } else {
      setRestaurants(data || []);
    }

    setLoading(false);
  };

  const getClaimStatus = (restaurant: any): ClaimStatus => {
    const claims = restaurant.restaurant_claims || [];

    if (claims.some((claim: any) => claim.status === "pending")) {
      return "pending";
    }

    if (
      claims.some(
        (claim: any) =>
          claim.status === "claimed" ||
          claim.status === "approved" ||
          claim.status === "completed"
      )
    ) {
      return "claimed";
    }

    if (claims.some((claim: any) => claim.status === "rejected")) {
      return "rejected";
    }

    return "unclaimed";
  };

  const getPendingClaim = (restaurant: any) => {
    return restaurant.restaurant_claims?.find(
      (claim: any) => claim.status === "pending"
    );
  };

  const approveClaim = async (claimId: string) => {
    const { error } = await supabase
      .from("restaurant_claims")
      .update({ status: "claimed" })
      .eq("id", claimId);

    if (error) {
      alert("Error approving claim");
      return;
    }

    fetchRestaurants();
  };

  const rejectClaim = async (claimId: string) => {
    const { error } = await supabase
      .from("restaurant_claims")
      .update({ status: "rejected" })
      .eq("id", claimId);

    if (error) {
      alert("Error rejecting claim");
      return;
    }

    fetchRestaurants();
  };

  const getRestaurantName = (restaurant: any) =>
    restaurant.restaurant_name ||
    restaurant.name ||
    restaurant.business_name ||
    restaurant.title ||
    "Unnamed Restaurant";

  const getRestaurantAddress = (restaurant: any) =>
    restaurant.address ||
    restaurant.restaurant_address ||
    restaurant.location ||
    "No address listed";

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const claimStatus = getClaimStatus(restaurant);
      const name = getRestaurantName(restaurant).toLowerCase();
      const address = getRestaurantAddress(restaurant).toLowerCase();
      const query = search.toLowerCase();

      const matchesSearch = name.includes(query) || address.includes(query);
      const matchesFilter = filter === "all" || claimStatus === filter;

      return matchesSearch && matchesFilter;
    });
  }, [restaurants, search, filter]);

  const stats = useMemo(() => {
    return {
      total: restaurants.length,
      claimed: restaurants.filter((r) => getClaimStatus(r) === "claimed")
        .length,
      pending: restaurants.filter((r) => getClaimStatus(r) === "pending")
        .length,
      unclaimed: restaurants.filter((r) => getClaimStatus(r) === "unclaimed")
        .length,
    };
  }, [restaurants]);

  const badgeClass = (status: ClaimStatus) => {
    if (status === "claimed") return "bg-blue-600 text-white";
    if (status === "pending") return "bg-yellow-500 text-black";
    if (status === "rejected") return "bg-red-600 text-white";
    return "bg-neutral-700 text-white";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AdminTopBar />
        <div className="p-6">Loading restaurants...</div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AdminTopBar />
        <div className="p-6 text-red-400">
          You are not authorized to view this page.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminTopBar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-500">
              RoseOut CMS
            </p>

            <h1 className="mt-2 text-4xl font-bold">Restaurant Listings</h1>

            <p className="mt-2 text-neutral-400">
              Manage listings, ownership claims, QR mailers, and restaurant
              profile content.
            </p>
          </div>

          <Link
            href="/admin/restaurants/new"
            className="rounded-full bg-yellow-500 px-6 py-3 font-extrabold text-black hover:bg-yellow-400"
          >
            Add Restaurant
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <button
            onClick={() => setFilter("all")}
            className="rounded-3xl bg-white p-5 text-left text-black"
          >
            <p className="text-sm font-semibold text-neutral-500">Total</p>
            <p className="mt-2 text-3xl font-black">{stats.total}</p>
          </button>

          <button
            onClick={() => setFilter("claimed")}
            className="rounded-3xl bg-white p-5 text-left text-black"
          >
            <p className="text-sm font-semibold text-neutral-500">Claimed</p>
            <p className="mt-2 text-3xl font-black">{stats.claimed}</p>
          </button>

          <button
            onClick={() => setFilter("pending")}
            className="rounded-3xl bg-white p-5 text-left text-black"
          >
            <p className="text-sm font-semibold text-neutral-500">
              Pending Claims
            </p>
            <p className="mt-2 text-3xl font-black">{stats.pending}</p>
          </button>

          <button
            onClick={() => setFilter("unclaimed")}
            className="rounded-3xl bg-white p-5 text-left text-black"
          >
            <p className="text-sm font-semibold text-neutral-500">Unclaimed</p>
            <p className="mt-2 text-3xl font-black">{stats.unclaimed}</p>
          </button>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurants by name or address..."
              className="w-full rounded-2xl border border-white/10 bg-black px-5 py-4 text-white outline-none placeholder:text-neutral-500 lg:max-w-xl"
            />

            <div className="flex flex-wrap gap-2">
              {(["all", "claimed", "pending", "unclaimed", "rejected"] as FilterStatus[]).map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${
                      filter === item
                        ? "bg-yellow-500 text-black"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {item === "pending" ? "Pending Claims" : item}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white">
          <div className="grid grid-cols-12 bg-neutral-100 px-5 py-4 text-xs font-black uppercase tracking-wide text-neutral-500">
            <div className="col-span-5">Listing</div>
            <div className="col-span-2 hidden md:block">Status</div>
            <div className="col-span-3 hidden lg:block">Claim Info</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-neutral-200">
            {filteredRestaurants.map((restaurant) => {
              const claimStatus = getClaimStatus(restaurant);
              const pendingClaim = getPendingClaim(restaurant);
              const restaurantName = getRestaurantName(restaurant);
              const restaurantAddress = getRestaurantAddress(restaurant);

              return (
                <div
                  key={restaurant.id}
                  className="grid grid-cols-12 gap-4 px-5 py-5 text-black hover:bg-neutral-50"
                >
                  <div className="col-span-12 md:col-span-5">
                    <Link
                      href={`/admin/restaurants/${restaurant.id}`}
                      className="text-lg font-black hover:underline"
                    >
                      {restaurantName}
                    </Link>

                    <p className="mt-1 text-sm text-neutral-500">
                      {restaurantAddress}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 md:hidden">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass(
                          claimStatus
                        )}`}
                      >
                        {claimStatus === "pending"
                          ? "Claim Pending"
                          : claimStatus === "claimed"
                          ? "Claimed"
                          : claimStatus === "rejected"
                          ? "Rejected"
                          : "Unclaimed"}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 hidden md:block">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass(
                        claimStatus
                      )}`}
                    >
                      {claimStatus === "pending"
                        ? "Claim Pending"
                        : claimStatus === "claimed"
                        ? "Claimed"
                        : claimStatus === "rejected"
                        ? "Rejected"
                        : "Unclaimed"}
                    </span>

                    {restaurant.is_featured && (
                      <span className="mt-2 inline-block rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-black">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="col-span-12 lg:col-span-3">
                    {pendingClaim ? (
                      <div className="rounded-2xl bg-yellow-50 p-4 text-sm">
                        <p className="font-bold text-yellow-700">
                          Pending Claim
                        </p>
                        <p className="mt-1">
                          {pendingClaim.owner_name || "No name"}
                        </p>
                        <p className="break-all text-neutral-600">
                          {pendingClaim.owner_email}
                        </p>
                        <p className="text-neutral-600">
                          {pendingClaim.owner_phone || "No phone"}
                        </p>

                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => approveClaim(pendingClaim.id)}
                            className="rounded-full bg-green-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => rejectClaim(pendingClaim.id)}
                            className="rounded-full bg-red-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="hidden text-sm text-neutral-500 lg:block">
                        No pending claim
                      </p>
                    )}
                  </div>

                  <div className="col-span-12 flex items-start justify-end gap-2 md:col-span-5 lg:col-span-2">
                    <Link
                      href={`/admin/restaurants/${restaurant.id}`}
                      className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
                    >
                      Edit
                    </Link>

                    {restaurant.claim_url && (
                      <a
                        href={restaurant.claim_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-black px-4 py-2 text-sm font-bold text-black"
                      >
                        Claim Link
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredRestaurants.length === 0 && (
              <div className="px-5 py-12 text-center text-neutral-500">
                No restaurants found.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}