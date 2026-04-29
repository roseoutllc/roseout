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

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    if (data.user.user_metadata?.role !== "superuser") {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    const { data: restaurantData } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    setRestaurants(restaurantData || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("restaurants").update({ status }).eq("id", id);
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

  if (loading) {
    return <main className="min-h-screen bg-black p-6 text-white">Loading...</main>;
  }

  if (unauthorized) {
    return <main className="min-h-screen bg-black p-6 text-white">Not authorized</main>;
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex gap-4">
          <a href="/admin" className="underline">Dashboard</a>
          <a href="/admin/restaurants" className="underline">Restaurants</a>
          <a href="/admin/invites" className="underline">Invites</a>
        </div>

        <h1 className="text-4xl font-bold">Manage Restaurants</h1>

        <div className="mt-8 space-y-6">
          {restaurants.map((r) => {
            const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent(
              `${r.address || ""} ${r.city || ""} ${r.state || ""} ${r.zip_code || ""}`
            )}`;

            return (
              <div key={r.id} className="rounded-3xl bg-white p-6 text-black">
                <div className="grid gap-6 md:grid-cols-[1fr_220px]">
                  <div>
                    <h2 className="text-2xl font-bold">{r.restaurant_name}</h2>

                    <p className="mt-1 text-sm text-neutral-600">
                      {r.address}, {r.city}, {r.state} {r.zip_code}
                    </p>

                    <p className="mt-2">
                      <strong>Status:</strong> {r.status}
                    </p>

                    <p className="mt-2">
                      <strong>Featured:</strong> {r.is_featured ? "Yes" : "No"}
                    </p>

                    {r.description && (
                      <p className="mt-4 leading-7">{r.description}</p>
                    )}

                    <div className="mt-4 grid gap-2 text-sm text-neutral-700">
                      {r.neighborhood && <p><strong>Neighborhood:</strong> {r.neighborhood}</p>}
                      {r.cuisine_type && <p><strong>Cuisine:</strong> {r.cuisine_type}</p>}
                      {r.price_range && <p><strong>Price:</strong> {r.price_range}</p>}
                      {r.phone && <p><strong>Phone:</strong> {r.phone}</p>}
                      {r.email && <p><strong>Email:</strong> {r.email}</p>}
                      {r.hours_of_operation && <p><strong>Hours:</strong> {r.hours_of_operation}</p>}
                      {r.kitchen_closing_time && <p><strong>Kitchen closes:</strong> {r.kitchen_closing_time}</p>}
                      {r.lighting && <p><strong>Lighting:</strong> {r.lighting}</p>}
                      {r.noise_level && <p><strong>Noise:</strong> {r.noise_level}</p>}
                      {r.atmosphere && <p><strong>Atmosphere:</strong> {r.atmosphere}</p>}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => updateStatus(r.id, "approved")}
                        className="rounded-xl bg-green-600 px-4 py-2 text-white"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => updateStatus(r.id, "rejected")}
                        className="rounded-xl bg-red-600 px-4 py-2 text-white"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() => toggleFeatured(r.id, r.is_featured)}
                        className={`rounded-xl px-4 py-2 ${
                          r.is_featured
                            ? "bg-yellow-500 text-black"
                            : "bg-neutral-900 text-white"
                        }`}
                      >
                        {r.is_featured ? "Remove Featured" : "Make Featured"}
                      </button>

                      <a href={mapsLink} target="_blank">
                        <button className="rounded-xl bg-black px-4 py-2 text-white">
                          Open Maps
                        </button>
                      </a>

                      {r.website && (
                        <a href={r.website} target="_blank">
                          <button className="rounded-xl bg-black px-4 py-2 text-white">
                            Website
                          </button>
                        </a>
                      )}

                      {r.reservation_link && (
                        <a href={r.reservation_link} target="_blank">
                          <button className="rounded-xl bg-black px-4 py-2 text-white">
                            Reservation
                          </button>
                        </a>
                      )}

                      {r.instagram_url && (
                        <a href={r.instagram_url} target="_blank">
                          <button className="rounded-xl bg-black px-4 py-2 text-white">
                            Instagram
                          </button>
                        </a>
                      )}

                      {r.tiktok_url && (
                        <a href={r.tiktok_url} target="_blank">
                          <button className="rounded-xl bg-black px-4 py-2 text-white">
                            TikTok
                          </button>
                        </a>
                      )}

                      {r.x_url && (
                        <a href={r.x_url} target="_blank">
                          <button className="rounded-xl bg-black px-4 py-2 text-white">
                            X
                          </button>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-neutral-50 p-4 text-center">
                    <h3 className="font-bold">QR Code</h3>

                    {r.qr_code_data_url ? (
                      <>
                        <img
                          src={r.qr_code_data_url}
                          alt={`${r.restaurant_name} QR`}
                          className="mx-auto mt-3 h-40 w-40"
                        />

                        <a
                          href={r.qr_code_data_url}
                          download={`${r.restaurant_name}-roseout-qr.png`}
                        >
                          <button className="mt-4 w-full rounded-xl bg-black px-4 py-2 text-white">
                            Download QR
                          </button>
                        </a>
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-neutral-500">
                        No QR available.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {restaurants.length === 0 && (
            <p className="rounded-2xl bg-white p-6 text-black">
              No restaurants found.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}