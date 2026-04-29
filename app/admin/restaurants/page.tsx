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
    return <main className="min-h-screen bg-black p-6 text-white">Loading...</main>;
  }

  if (unauthorized) {
    return <main className="min-h-screen bg-black p-6 text-white">Not authorized</main>;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminTopBar />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-4xl font-bold">Manage Restaurants</h1>

        <div className="mt-8 grid gap-4">
          {restaurants.map((r) => (
            <a
              key={r.id}
              href={`/admin/restaurants/${r.id}`}
              className="rounded-3xl bg-white p-6 text-black hover:bg-neutral-100"
            >
              <h2 className="text-2xl font-bold">{r.restaurant_name}</h2>

              <p className="mt-1 text-sm text-neutral-600">
                {r.address}, {r.city}, {r.state} {r.zip_code}
              </p>

              <div className="mt-3 flex gap-3 text-sm">
                <span className="rounded-full bg-black px-3 py-1 text-white">
                  {r.status}
                </span>

                {r.is_featured && (
                  <span className="rounded-full bg-yellow-500 px-3 py-1 text-black">
                    Featured
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}