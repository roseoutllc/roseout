"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

type ClaimStatus = "pending" | "claimed" | "rejected";

export default function AdminClaimsPage() {
  const supabase = createClient();

  const [claims, setClaims] = useState<any[]>([]);
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

      fetchClaims();
    };

    init();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);

    const { data: claimsData, error: claimsError } = await supabase
      .from("restaurant_claims")
      .select("*")
      .order("created_at", { ascending: false });

    if (claimsError) {
      console.error("Error loading claims:", claimsError);
      setLoading(false);
      return;
    }

    const restaurantIds = [
      ...new Set(
        (claimsData || [])
          .map((claim) => claim.restaurant_id)
          .filter(Boolean)
      ),
    ];

    let restaurantsData: any[] = [];

    if (restaurantIds.length > 0) {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, restaurant_name, name, address")
        .in("id", restaurantIds);

      if (error) {
        console.error("Error loading restaurants:", error);
      } else {
        restaurantsData = data || [];
      }
    }

    const claimsWithRestaurants = (claimsData || []).map((claim) => {
      const restaurant = restaurantsData.find(
        (r) => r.id === claim.restaurant_id
      );

      return {
        ...claim,
        restaurant,
      };
    });

    setClaims(claimsWithRestaurants);
    setLoading(false);
  };

  const updateClaimStatus = async (id: string, status: ClaimStatus) => {
    try {
      const res = await fetch("/api/admin/claims/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) {
        throw new Error("Failed to update claim");
      }

      fetchClaims();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AdminTopBar />
        <div className="p-6">Loading claims...</div>
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
        <h1 className="mb-6 text-3xl font-bold">Restaurant Claims</h1>

        <div className="space-y-4">
          {claims.map((claim) => {
            const restaurantName =
              claim.restaurant?.restaurant_name ||
              claim.restaurant?.name ||
              claim.restaurant_name ||
              "Unnamed Restaurant";

            const restaurantAddress =
              claim.restaurant?.address || claim.address || "No address";

            return (
              <div
                key={claim.id}
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {restaurantName}
                    </h2>

                    <p className="text-sm text-gray-400">
                      {restaurantAddress}
                    </p>

                    <div className="mt-3">
                      {claim.status === "pending" && (
                        <span className="rounded-full bg-yellow-500 px-3 py-1 text-sm text-black">
                          Pending
                        </span>
                      )}

                      {claim.status === "claimed" && (
                        <span className="rounded-full bg-blue-600 px-3 py-1 text-sm text-white">
                          Claimed
                        </span>
                      )}

                      {claim.status === "rejected" && (
                        <span className="rounded-full bg-red-600 px-3 py-1 text-sm text-white">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm">
                    <p>
                      <strong>Name:</strong> {claim.owner_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {claim.owner_email}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {claim.owner_phone || "Not provided"}
                    </p>

                    {claim.status === "pending" && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() =>
                            updateClaimStatus(claim.id, "claimed")
                          }
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            updateClaimStatus(claim.id, "rejected")
                          }
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {claims.length === 0 && (
            <p className="text-gray-400">No claims found.</p>
          )}
        </div>
      </main>
    </div>
  );
}