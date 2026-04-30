"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";
import { requireAdminRole } from "@/lib/admin-auth";

export default async function AdminRestaurantsPage() {
  await requireAdminRole(["superuser", "admin", "editor", "viewer"]);

  // rest of your page
}
  const supabase = createClient();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantClaims, setRestaurantClaims] = useState<any[]>([]);
  const [activityClaims, setActivityClaims] = useState<any[]>([]);
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

      const [restaurantsRes, claimsRes] = await Promise.all([
        fetch("/api/admin/restaurants"),
        fetch("/api/admin/claims"),
      ]);

      const restaurantsJson = await restaurantsRes.json();
      const claimsJson = await claimsRes.json();

      setRestaurants(restaurantsJson.restaurants || []);
      setRestaurantClaims(claimsJson.restaurantClaims || []);
      setActivityClaims(claimsJson.activityClaims || []);

      setLoading(false);
    };

    init();
  }, []);

  const updateClaim = async (id: string, type: string, status: string) => {
    await fetch("/api/admin/claims/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, type, status }),
    });

    if (type === "restaurant") {
      setRestaurantClaims((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    }

    if (type === "activity") {
      setActivityClaims((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    }
  };

  const getClaimStatus = (restaurantId: string) => {
    const claims = restaurantClaims.filter(
      (c) => c.restaurant_id === restaurantId
    );

    if (claims.length === 0) return "unclaimed";

    if (claims.some((c) => c.status === "pending")) return "pending";
    if (claims.some((c) => c.status === "approved")) return "claimed";
    if (claims.some((c) => c.status === "rejected")) return "rejected";

    return "unclaimed";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        Loading...
      </main>
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

        {/* Restaurants */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold">Restaurants</h2>

          <div className="mt-4 grid gap-4">
            {restaurants.length === 0 ? (
              <p className="text-neutral-400">No restaurants found.</p>
            ) : (
              restaurants.map((r) => {
                const claimStatus = getClaimStatus(r.id);

                return (
                  <Link
                    key={r.id}
                    href={`/admin/restaurants/${r.id}`}
                    className="block rounded-3xl bg-white p-6 text-black transition hover:bg-neutral-100"
                  >
                    <h3 className="text-2xl font-bold">
                      {r.restaurant_name || "Unnamed Restaurant"}
                    </h3>

                    <p className="mt-1 text-sm text-neutral-600">
                      {r.address}, {r.city}, {r.state} {r.zip_code}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <span className="rounded-full bg-black px-3 py-1 text-white">
                        {r.status || "approved"}
                      </span>

                      {r.is_featured && (
                        <span className="rounded-full bg-yellow-500 px-3 py-1 text-black">
                          Featured
                        </span>
                      )}

                      {claimStatus === "pending" && (
                        <span className="rounded-full bg-yellow-500 px-3 py-1 text-black">
                          Claim Pending
                        </span>
                      )}

                      {claimStatus === "claimed" && (
                        <span className="rounded-full bg-blue-600 px-3 py-1 text-white">
                          Claimed
                        </span>
                      )}

                      {claimStatus === "rejected" && (
                        <span className="rounded-full bg-red-600 px-3 py-1 text-white">
                          Claim Rejected
                        </span>
                      )}

                      {claimStatus === "unclaimed" && (
                        <span className="rounded-full bg-neutral-600 px-3 py-1 text-white">
                          Unclaimed
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* Restaurant Claims */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold">Restaurant Claims</h2>

          <div className="mt-4 grid gap-4">
            {restaurantClaims.map((c) => (
              <div key={c.id} className="rounded-2xl bg-white p-6 text-black">
                <h3 className="text-xl font-bold">{c.restaurant_name}</h3>

                <p className="mt-1 text-sm text-neutral-600">
                  {c.owner_name} — {c.owner_email}
                </p>

                {c.message && (
                  <p className="mt-2 text-sm text-neutral-700">
                    {c.message}
                  </p>
                )}

                {c.status === "pending" && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() =>
                        updateClaim(c.id, "restaurant", "approved")
                      }
                      className="rounded-full bg-green-600 px-4 py-2 text-white"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        updateClaim(c.id, "restaurant", "rejected")
                      }
                      className="rounded-full bg-red-600 px-4 py-2 text-white"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Activity Claims */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold">Activity Claims</h2>

          <div className="mt-4 grid gap-4">
            {activityClaims.map((c) => (
              <div key={c.id} className="rounded-2xl bg-white p-6 text-black">
                <h3 className="text-xl font-bold">{c.activity_name}</h3>

                <p className="mt-1 text-sm text-neutral-600">
                  {c.owner_name} — {c.owner_email}
                </p>

                {c.message && (
                  <p className="mt-2 text-sm text-neutral-700">
                    {c.message}
                  </p>
                )}

                {c.status === "pending" && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() =>
                        updateClaim(c.id, "activity", "approved")
                      }
                      className="rounded-full bg-green-600 px-4 py-2 text-white"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        updateClaim(c.id, "activity", "rejected")
                      }
                      className="rounded-full bg-red-600 px-4 py-2 text-white"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}