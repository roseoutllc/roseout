"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

export default function AdminRestaurantDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const id = params.id as string;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState("");

  const loadRestaurant = async () => {
    const res = await fetch(`/api/admin/restaurants/${id}`);
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Could not load restaurant.");
      setLoading(false);
      return;
    }

    setRestaurant(data.restaurant);
    setLoading(false);
  };

  const updateRestaurant = async (updates: any) => {
    const res = await fetch(`/api/admin/restaurants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Update failed.");
      return;
    }

    setMessage("Restaurant updated.");
    loadRestaurant();
  };

  const printLabel = () => {
    if (!restaurant) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>${restaurant.restaurant_name}</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            .label {
              width: 420px;
              display: flex;
              gap: 16px;
              align-items: center;
              border: 1px solid #ddd;
              border-radius: 12px;
              padding: 16px;
            }
            img { width: 120px; height: 120px; }
            h2 { margin: 0; font-size: 18px; }
            p { margin: 4px 0; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="label">
            <img src="${restaurant.qr_code_data_url || ""}" />
            <div>
              <h2>${restaurant.restaurant_name || ""}</h2>
              <p>${restaurant.address || ""}</p>
              <p>${restaurant.city || ""}, ${restaurant.state || ""} ${restaurant.zip_code || ""}</p>
              <p><strong>Scan to manage your listing</strong></p>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

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

      loadRestaurant();
    };

    init();
  }, []);

  if (loading) {
    return <main className="min-h-screen bg-black p-6 text-white">Loading...</main>;
  }

  if (unauthorized) {
    return <main className="min-h-screen bg-black p-6 text-white">Not authorized</main>;
  }

  if (!restaurant) {
    return <main className="min-h-screen bg-black p-6 text-white">{message}</main>;
  }

  const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent(
    `${restaurant.address || ""} ${restaurant.city || ""} ${restaurant.state || ""} ${restaurant.zip_code || ""}`
  )}`;

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminTopBar />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <a href="/admin/restaurants" className="underline">
          ← Back to Restaurants
        </a>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_340px]">
          <section className="rounded-3xl bg-white p-6 text-black">
            <h1 className="text-4xl font-bold">{restaurant.restaurant_name}</h1>

            <p className="mt-2 text-neutral-600">
              {restaurant.address}, {restaurant.city}, {restaurant.state}{" "}
              {restaurant.zip_code}
            </p>

            <p className="mt-4">
              <strong>Status:</strong> {restaurant.status}
            </p>

            <p className="mt-2">
              <strong>Featured:</strong>{" "}
              {restaurant.is_featured ? "Yes" : "No"}
            </p>

            {restaurant.description && (
              <p className="mt-6 leading-7">{restaurant.description}</p>
            )}

            <div className="mt-6 grid gap-2 text-sm text-neutral-700">
              {restaurant.email && <p><strong>Email:</strong> {restaurant.email}</p>}
              {restaurant.phone && <p><strong>Phone:</strong> {restaurant.phone}</p>}
              {restaurant.neighborhood && <p><strong>Neighborhood:</strong> {restaurant.neighborhood}</p>}
              {restaurant.cuisine_type && <p><strong>Cuisine:</strong> {restaurant.cuisine_type}</p>}
              {restaurant.price_range && <p><strong>Price:</strong> {restaurant.price_range}</p>}
              {restaurant.hours_of_operation && <p><strong>Hours:</strong> {restaurant.hours_of_operation}</p>}
              {restaurant.kitchen_closing_time && <p><strong>Kitchen closes:</strong> {restaurant.kitchen_closing_time}</p>}
              {restaurant.lighting && <p><strong>Lighting:</strong> {restaurant.lighting}</p>}
              {restaurant.noise_level && <p><strong>Noise Level:</strong> {restaurant.noise_level}</p>}
              {restaurant.atmosphere && <p><strong>Atmosphere:</strong> {restaurant.atmosphere}</p>}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => updateRestaurant({ status: "approved" })}
                className="rounded-xl bg-green-600 px-4 py-2 text-white"
              >
                Approve
              </button>

              <button
                onClick={() => updateRestaurant({ status: "rejected" })}
                className="rounded-xl bg-red-600 px-4 py-2 text-white"
              >
                Reject
              </button>

              <button
                onClick={() =>
                  updateRestaurant({ is_featured: !restaurant.is_featured })
                }
                className="rounded-xl bg-yellow-500 px-4 py-2 text-black"
              >
                {restaurant.is_featured ? "Remove Featured" : "Make Featured"}
              </button>

              <a href={mapsLink} target="_blank">
                <button className="rounded-xl bg-black px-4 py-2 text-white">
                  Open Maps
                </button>
              </a>

              {restaurant.website && (
                <a href={restaurant.website} target="_blank">
                  <button className="rounded-xl bg-black px-4 py-2 text-white">
                    Website
                  </button>
                </a>
              )}

              {restaurant.reservation_link && (
                <a href={restaurant.reservation_link} target="_blank">
                  <button className="rounded-xl bg-black px-4 py-2 text-white">
                    Reservation
                  </button>
                </a>
              )}
            </div>

            {message && (
              <p className="mt-6 rounded-xl bg-neutral-100 p-3 font-semibold">
                {message}
              </p>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 text-center text-black">
            <h2 className="text-2xl font-bold">QR Label</h2>

            {restaurant.qr_code_data_url ? (
              <>
                <div className="mt-4 flex items-center gap-4 rounded-xl border bg-white p-4 text-left">
                  <img
                    src={restaurant.qr_code_data_url}
                    alt="QR Code"
                    className="h-32 w-32"
                  />

                  <div>
                    <h3 className="font-bold">{restaurant.restaurant_name}</h3>
                    <p className="text-sm">{restaurant.address}</p>
                    <p className="text-sm">
                      {restaurant.city}, {restaurant.state}{" "}
                      {restaurant.zip_code}
                    </p>
                  </div>
                </div>

                <button
                  onClick={printLabel}
                  className="mt-4 w-full rounded-xl bg-black px-4 py-2 text-white"
                >
                  Print Label
                </button>
              </>
            ) : (
              <p className="mt-4 text-neutral-500">No QR available.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}