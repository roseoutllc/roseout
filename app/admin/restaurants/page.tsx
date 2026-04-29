"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

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

    const html = `
      <html>
        <head>
          <title>${r.restaurant_name}</title>
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
            <img src="${r.qr_code_data_url || ""}" />
            <div>
              <h2>${r.restaurant_name}</h2>
              <p>${r.address || ""}</p>
              <p>${r.city || ""}, ${r.state || ""} ${r.zip_code || ""}</p>
              <p><strong>Scan to manage your listing</strong></p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
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

      await loadRestaurants();
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

      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-4xl font-bold">Manage Restaurants</h1>

        {message && (
          <p className="mt-4 rounded-xl bg-white p-3 text-black">
            {message}
          </p>
        )}

        <div className="mt-8 space-y-6">
          {restaurants.map((r) => {
            const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent(
              `${r.address || ""} ${r.city || ""} ${r.state || ""} ${r.zip_code || ""}`
            )}`;

            return (
              <div key={r.id} className="rounded-3xl bg-white p-6 text-black">
                <div className="grid gap-6 md:grid-cols-[1fr_320px]">

                  {/* LEFT */}
                  <div>
                    <h2 className="text-2xl font-bold">{r.restaurant_name}</h2>

                    <p className="mt-1 text-sm text-neutral-600">
                      {r.address}, {r.city}, {r.state} {r.zip_code}
                    </p>

                    <p className="mt-2"><strong>Status:</strong> {r.status}</p>
                    <p className="mt-2"><strong>Featured:</strong> {r.is_featured ? "Yes" : "No"}</p>

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
                        className="rounded-xl bg-neutral-900 px-4 py-2 text-white"
                      >
                        Toggle Featured
                      </button>

                      <a href={mapsLink} target="_blank">
                        <button className="rounded-xl bg-black px-4 py-2 text-white">
                          Maps
                        </button>
                      </a>
                    </div>
                  </div>

                  {/* RIGHT QR */}
                  <div className="rounded-2xl border bg-neutral-50 p-4">
                    <h3 className="mb-3 text-center font-bold">
                      QR Label
                    </h3>

                    {r.qr_code_data_url ? (
                      <>
                        <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
                          <img
                            src={r.qr_code_data_url}
                            className="h-32 w-32"
                          />

                          <div>
                            <h4 className="text-lg font-bold">
                              {r.restaurant_name}
                            </h4>
                            <p className="text-sm">{r.address}</p>
                            <p className="text-sm">
                              {r.city}, {r.state} {r.zip_code}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => printLabel(r)}
                          className="mt-4 w-full rounded-xl bg-black px-4 py-2 text-white"
                        >
                          Print Label
                        </button>
                      </>
                    ) : (
                      <p>No QR</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}