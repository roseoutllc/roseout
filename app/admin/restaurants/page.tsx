"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

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

      const res = await fetch("/api/admin/restaurants");
      const dataJson = await res.json();

      setRestaurants(dataJson.restaurants || []);
      setLoading(false);
    };

    init();
  }, []);

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
          Review restaurants, claim status, QR codes, and listing details.
        </p>

        <div className="mt-8 grid gap-4">
          {restaurants.map((r) => (
            <a
              key={r.id}
              href={`/admin/restaurants/${r.id}`}
              className="rounded-3xl border border-white/10 bg-neutral-950 p-6 text-white hover:bg-neutral-900"
            >
              <div className="flex items-start gap-5">
                {r.qr_code_data_url && (
                  <img
                    src={r.qr_code_data_url}
                    alt={`${r.restaurant_name || "Restaurant"} QR`}
                    className="h-20 w-20 rounded-xl bg-white p-1"
                  />
                )}

                <div className="flex-1">
                  <h2 className="text-2xl font-bold">
                    {r.restaurant_name || r.name || "Unnamed Restaurant"}
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
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}