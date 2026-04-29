"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminRestaurantsPage() {
  const supabase = createClient();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState("");

  const loadRestaurants = async () => {
    try {
      const res = await fetch("/api/admin/restaurants");
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to load restaurants.");
        return;
      }

      setRestaurants(data.restaurants || []);
    } catch {
      setMessage("Could not connect to admin restaurant API.");
    }
  };

  const updateRestaurant = async (id: string, updates: any) => {
    setMessage("");

    const res = await fetch("/api/admin/restaurants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Update failed.");
      return;
    }

    setMessage("Restaurant updated.");
    loadRestaurants();
  };

  const printLabel = (r: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${r.restaurant_name} RoseOut QR Label</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .label {
              width: 320px;
              border: 1px solid #ddd;
              border-radius: 14px;
              padding: 18px;
              text-align: center;
            }
            img { width: 160px; height: 160px; }
            h2 { font-size: 20px; margin: 12px 0 6px; }
            p { font-size: 14px; margin: 3px 0; }
            .small { margin-top: 12px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="label">
            <img src="${r.qr_code_data_url || ""}" />
            <h2>${r.restaurant_name || ""}</h2>
            <p>${r.address || ""}</p>
            <p>${r.city || ""}, ${r.state || ""} ${r.zip_code || ""}</p>
            <p class="small">Scan to manage your RoseOut listing</p>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  useEffect(() => {
    const init = async () => {
      try {
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

        await loadRestaurants();
        setLoading(false);
      } catch {
        setUnauthorized(true);
        setLoading(false);
      }
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
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex gap-4">
          <a href="/admin" className="underline">Dashboard</a>
          <a href="/admin/restaurants" className="underline">Restaurants</a>
          <a href="/admin/invites" className="underline">Invites</a>
        </div>

        <h1 className="text-4xl font-bold">Manage Restaurants</h1>

        {message && (
          <p className="mt-4 rounded-xl bg-white p-3 text-black">{message}</p>
        )}

        <div className="mt-8 space-y-6">
          {restaurants.map((r) => {
            const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent(
              `${r.address || ""} ${r.city || ""} ${r.state || ""} ${r.zip_code || ""}`
            )}`;

            return (
              <div key={r.id} className="rounded-3xl bg-white p-6 text-black">
                <div className="grid gap-6 md:grid-cols-[1fr_320px]">
                  <div>
                    <h2 className="text-2xl font-bold">{r.restaurant_name}</h2>

                    <p className="mt-1 text-sm text-neutral-600">
                      {r.address}, {r.city}, {r.state} {r.zip_code}
                    </p>

                    <p className="mt-2"><strong>Status:</strong> {r.status}</p>
                    <p className="mt-2"><strong>Featured:</strong> {r.is_featured ? "Yes" : "No"}</p>

                    {r.description && <p className="mt-4 leading-7">{r.description}</p>}

                    <div className="mt-4 grid gap-2 text-sm text-neutral-700">
                      {r.email && <p><strong>Email:</strong> {r.email}</p>}
                      {r.phone && <p><strong>Phone:</strong> {r.phone}</p>}
                      {r.cuisine_type && <p><strong>Cuisine:</strong> {r.cuisine_type}</p>}
                      {r.price_range && <p><strong>Price:</strong> {r.price_range}</p>}
                      {r.hours_of_operation && <p><strong>Hours:</strong> {r.hours_of_operation}</p>}
                      {r.kitchen_closing_time && <p><strong>Kitchen closes:</strong> {r.kitchen_closing_time}</p>}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => updateRestaurant(r.id, { status: "approved" })}
                        className="rounded-xl bg-green-600 px-4 py-2 text-white"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => updateRestaurant(r.id, { status: "rejected" })}
                        className="rounded-xl bg-red-600 px-4 py-2 text-white"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() => updateRestaurant(r.id, { is_featured: !r.is_featured })}
                        className={`rounded-xl px-4 py-2 ${
                          r.is_featured ? "bg-yellow-500 text-black" : "bg-neutral-900 text-white"
                        }`}
                      >
                        {r.is_featured ? "Remove Featured" : "Make Featured"}
                      </button>

                      <a href={mapsLink} target="_blank">
                        <button className="rounded-xl bg-black px-4 py-2 text-white">Open Maps</button>
                      </a>

                      {r.website && (
                        <a href={r.website} target="_blank">
                          <button className="rounded-xl bg-black px-4 py-2 text-white">Website</button>
                        </a>
                      )}

                      {r.reservation_link && (
                        <a href={r.reservation_link} target="_blank">
                          <button className="rounded-xl bg-black px-4 py-2 text-white">Reservation</button>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-neutral-50 p-4 text-center">
                    <h3 className="font-bold">Printable QR Label</h3>

                    {r.qr_code_data_url ? (
                      <>
                        <div className="mx-auto mt-3 w-[260px] rounded-xl border bg-white p-4">
                          <img
                            src={r.qr_code_data_url}
                            alt={`${r.restaurant_name} QR`}
                            className="mx-auto h-40 w-40"
                          />

                          <h4 className="mt-3 text-lg font-bold leading-tight">
                            {r.restaurant_name}
                          </h4>

                          <p className="mt-1 text-sm leading-tight">{r.address}</p>

                          <p className="text-sm leading-tight">
                            {r.city}, {r.state} {r.zip_code}
                          </p>

                          <p className="mt-2 text-xs font-semibold">
                            Scan to manage your RoseOut listing
                          </p>
                        </div>

                        <button
                          onClick={() => printLabel(r)}
                          className="mt-4 w-full rounded-xl bg-black px-4 py-2 text-white"
                        >
                          Download / Print Label
                        </button>
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