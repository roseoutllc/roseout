"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

export default function AdminClaimsPage() {
  const supabase = createClient();

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

      const res = await fetch("/api/admin/claims");
      const dataJson = await res.json();

      setRestaurantClaims(dataJson.restaurantClaims || []);
      setActivityClaims(dataJson.activityClaims || []);

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

    // Refresh after update
    window.location.reload();
  };

  if (loading) {
    return <main className="min-h-screen bg-black p-6 text-white">Loading...</main>;
  }

  if (unauthorized) {
    return <main className="min-h-screen bg-black p-6 text-white">Not authorized</main>;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminTopBar />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-4xl font-bold">Claims</h1>

        {/* Restaurant Claims */}
        <h2 className="mt-10 text-2xl font-bold">Restaurant Claims</h2>

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

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => updateClaim(c.id, "restaurant", "approved")}
                  className="rounded-full bg-green-600 px-4 py-2 text-white"
                >
                  Approve
                </button>

                <button
                  onClick={() => updateClaim(c.id, "restaurant", "rejected")}
                  className="rounded-full bg-red-600 px-4 py-2 text-white"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Claims */}
        <h2 className="mt-10 text-2xl font-bold">Activity Claims</h2>

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

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => updateClaim(c.id, "activity", "approved")}
                  className="rounded-full bg-green-600 px-4 py-2 text-white"
                >
                  Approve
                </button>

                <button
                  onClick={() => updateClaim(c.id, "activity", "rejected")}
                  className="rounded-full bg-red-600 px-4 py-2 text-white"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}