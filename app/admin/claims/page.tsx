"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

type ClaimStatus = "approved" | "rejected";

type LocationClaim = {
  id: string;
  type: "restaurant" | "activity";
  location_name: string;
  location_type?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  message?: string | null;
  status: string;
  created_at?: string;
};

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<LocationClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchClaims() {
    setLoading(true);

    const res = await fetch("/api/admin/claims", {
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(data.error || "Failed to load claims");
      setClaims([]);
      setLoading(false);
      return;
    }

    const restaurantClaims: LocationClaim[] = (data.restaurantClaims || []).map(
      (claim: any) => ({
        id: claim.id,
        type: "restaurant",
        location_name:
          claim.restaurant_name || claim.location_name || "Unnamed Restaurant",
        address: claim.address,
        city: claim.city,
        state: claim.state,
        zip_code: claim.zip_code,
        owner_name: claim.owner_name,
        owner_email: claim.owner_email,
        owner_phone: claim.owner_phone,
        message: claim.message,
        status: claim.status,
        created_at: claim.created_at,
      })
    );

    const activityClaims: LocationClaim[] = (data.activityClaims || []).map(
      (claim: any) => ({
        id: claim.id,
        type: "activity",
        location_name:
          claim.activity_name || claim.location_name || "Unnamed Activity",
        location_type: claim.activity_type,
        address: claim.address,
        city: claim.city,
        state: claim.state,
        zip_code: claim.zip_code,
        owner_name: claim.owner_name,
        owner_email: claim.owner_email,
        owner_phone: claim.owner_phone,
        message: claim.message,
        status: claim.status,
        created_at: claim.created_at,
      })
    );

    setClaims([...restaurantClaims, ...activityClaims]);
    setLoading(false);
  }

  useEffect(() => {
    fetchClaims();
  }, []);

  async function updateClaimStatus(
    id: string,
    type: "restaurant" | "activity",
    status: ClaimStatus
  ) {
    setUpdatingId(id);

    const res = await fetch("/api/admin/claims/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, type, status }),
    });

    const data = await res.json();

    setUpdatingId(null);

    if (!res.ok) {
      alert(data.error || "Failed to update location claim.");
      return;
    }

    await fetchClaims();

    if (status === "approved" && data.signup_url) {
      alert(`Location claim approved.\n\nOwner signup link:\n${data.signup_url}`);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminTopBar />

      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
              RoseOut Admin
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Location Claims
            </h1>

            <p className="mt-2 text-sm text-white/55">
              Review restaurant and activity owner requests in one place.
            </p>
          </div>

          <button
            onClick={fetchClaims}
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-white hover:bg-white hover:text-black"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-white/60">
            Loading location claims...
          </div>
        ) : claims.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-white/60">
            No pending location claims found.
          </div>
        ) : (
          <div className="grid gap-4">
            {claims.map((claim) => {
              const address = [
                claim.address,
                claim.city,
                claim.state,
                claim.zip_code,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <section
                  key={`${claim.type}-${claim.id}`}
                  className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl"
                >
                  <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase text-white">
                          {claim.type === "restaurant"
                            ? "Restaurant"
                            : "Activity"}
                        </span>

                        <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase text-yellow-200">
                          {claim.status}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-black">
                        {claim.location_name}
                      </h2>

                      {claim.location_type && (
                        <p className="mt-1 text-sm font-bold text-red-200">
                          {claim.location_type}
                        </p>
                      )}

                      {address && (
                        <p className="mt-2 text-sm leading-6 text-white/55">
                          {address}
                        </p>
                      )}

                      {claim.message && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-4">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
                            Message
                          </p>
                          <p className="mt-2 text-sm leading-6 text-white/70">
                            {claim.message}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
                        Owner Info
                      </p>

                      <div className="mt-4 space-y-2 text-sm">
                        <p>
                          <span className="text-white/40">Name:</span>{" "}
                          <strong>{claim.owner_name || "Not provided"}</strong>
                        </p>

                        <p>
                          <span className="text-white/40">Email:</span>{" "}
                          <strong>{claim.owner_email || "Not provided"}</strong>
                        </p>

                        <p>
                          <span className="text-white/40">Phone:</span>{" "}
                          <strong>{claim.owner_phone || "Not provided"}</strong>
                        </p>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                          disabled={updatingId === claim.id}
                          onClick={() =>
                            updateClaimStatus(
                              claim.id,
                              claim.type,
                              "approved"
                            )
                          }
                          className="rounded-full bg-green-600 px-4 py-3 text-sm font-black text-white hover:bg-green-500 disabled:opacity-50"
                        >
                          Approve
                        </button>

                        <button
                          disabled={updatingId === claim.id}
                          onClick={() =>
                            updateClaimStatus(
                              claim.id,
                              claim.type,
                              "rejected"
                            )
                          }
                          className="rounded-full bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-500 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}