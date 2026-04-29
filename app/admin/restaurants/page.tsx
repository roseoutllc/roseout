"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

type ClaimStatus = "pending" | "rejected" | "unclaimed" | "claimed";

export default function AdminRestaurantsPage() {
  const supabase = createClient();

  const [restaurants, setRestaurants] = useState<any[]>([]);
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

    if (claims.some((claim: any) => claim.status === "claimed")) {
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
      console.error(error);
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
      console.error(error);
      return;
    }

    fetchRestaurants();
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

      <main className="p-6">
        <h1 className="mb-6 text-3xl font-bold">Manage Restaurants</h1>

        <div className="space-y-4">
          {restaurants.map((restaurant) => {
            const claimStatus = getClaimStatus(restaurant);
            const pendingClaim = getPendingClaim(restaurant);

            return (
              <div
                key={restaurant.id}
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {restaurant.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                      {restaurant.address || "No address listed"}
                    </p>

                    <div className="mt-3">
                      {claimStatus === "unclaimed" && (
                        <span className="rounded-full bg-gray-700 px-3 py-1 text-sm text-white">
                          Unclaimed
                        </span>
                      )}

                      {claimStatus === "pending" && (
                        <span className="rounded-full bg-yellow-500 px-3 py-1 text-sm text-black">
                          Claim Pending
                        </span>
                      )}

                      {claimStatus === "rejected" && (
                        <span className="rounded-full bg-red-600 px-3 py-1 text-sm text-white">
                          Claim Rejected
                        </span>
                      )}

                      {claimStatus === "claimed" && (
                        <span className="rounded-full bg-blue-600 px-3 py-1 text-sm text-white">
                          Claimed
                        </span>
                      )}
                    </div>
                  </div>

                  {pendingClaim && (
                    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 md:w-[320px]">
                      <h3 className="mb-2 font-semibold text-yellow-300">
                        Pending Claim
                      </h3>

                      <p className="text-sm">
                        <strong>Name:</strong> {pendingClaim.owner_name}
                      </p>

                      <p className="text-sm">
                        <strong>Email:</strong> {pendingClaim.owner_email}
                      </p>

                      <p className="text-sm">
                        <strong>Phone:</strong>{" "}
                        {pendingClaim.owner_phone || "Not provided"}
                      </p>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => approveClaim(pendingClaim.id)}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                          Approve Claim
                        </button>

                        <button
                          onClick={() => rejectClaim(pendingClaim.id)}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
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

          {restaurants.length === 0 && (
            <p className="text-gray-400">No restaurants found.</p>
          )}
        </div>
      </main>
    </div>
  );
}