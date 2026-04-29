"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminRestaurantsPage() {
  const supabase = createClient();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const loadRestaurants = async () => {
    const { data } = await supabase.auth.getUser();

    // 🔐 Not logged in
    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    // 🔐 Not admin
    if (data.user.user_metadata?.role !== "superuser") {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    // ✅ Load restaurants
    const { data: restaurantData } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    setRestaurants(restaurantData || []);
    setLoading(false);
  };

  const approveRestaurant = async (id: string) => {
    await supabase
      .from("restaurants")
      .update({ status: "approved" })
      .eq("id", id);

    loadRestaurants();
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase
      .from("restaurants")
      .update({ is_featured: !current })
      .eq("id", id);

    loadRestaurants();
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  // 🔥 Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        Loading...
      </main>
    );
  }

  // 🔥 Unauthorized
  if (unauthorized) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        Not authorized
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold">Manage Restaurants</h1>

        <p className="mt-3 text-neutral-400">
          Approve, feature, and manage restaurant listings.
        </p>

        <div className="mt-8 space-y-6">
          {restaurants.map((r) => (
            <div
              key={r.id}
              className="rounded-3xl bg-white p-6 text-black"
            >
              <h2 className="text-2xl font-bold">
                {r.restaurant_name}
              </h2>

              <p className="text-sm text-neutral-600">
                {r.city}, {r.state}
              </p>

              <p className="mt-2">
                Status:{" "}
                <span className="font-semibold">{r.status}</span>
              </p>

              <div className="mt-4 flex gap-3">
                {r.status !== "approved" && (
                  <button
                    onClick={() => approveRestaurant(r.id)}
                    className="rounded bg-green-600 px-4 py-2 text-white"
                  >
                    Approve
                  </button>
                )}

                <button
                  onClick={() =>
                    toggleFeatured(r.id, r.is_featured)
                  }
                  className={`rounded px-4 py-2 text-white ${
                    r.is_featured
                      ? "bg-yellow-500 text-black"
                      : "bg-neutral-800"
                  }`}
                >
                  {r.is_featured ? "Featured" : "Make Featured"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}