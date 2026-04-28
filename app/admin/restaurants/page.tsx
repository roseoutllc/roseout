"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminRestaurantsPage() {
  const supabase = createClient();
  const [restaurants, setRestaurants] = useState<any[]>([]);

  const fetchRestaurants = async () => {
    const res = await fetch("/api/admin/restaurants");
    const data = await res.json();
    setRestaurants(data.restaurants || []);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/restaurants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    fetchRestaurants();
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      fetchRestaurants();
    };

    checkUser();
  }, []);

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex gap-4">
          <a href="/admin" className="underline">Dashboard</a>
          <a href="/admin/restaurants" className="underline">Restaurants</a>
          <a href="/admin/invites" className="underline">Invites</a>
        </div>

        <h1 className="text-4xl font-bold">Restaurant Approvals</h1>

        <div className="mt-8 grid gap-6">
          {restaurants.map((r) => (
            <div key={r.id} className="rounded-3xl bg-white p-6 text-black">
              <div className="grid gap-6 md:grid-cols-[1fr_340px]">
                <div>
                  <h2 className="text-2xl font-bold">{r.restaurant_name}</h2>

                  <p className="mt-1 text-sm text-neutral-600">
                    {r.address}, {r.city}, {r.state} {r.zip_code}
                  </p>

                  <p className="mt-3">{r.description}</p>

                  <p className="mt-3 text-sm">
                    <strong>Status:</strong> {r.status}
                  </p>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => updateStatus(r.id, "approved")}
                      className="rounded-xl bg-green-500 px-4 py-2 text-white"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => updateStatus(r.id, "rejected")}
                      className="rounded-xl bg-red-500 px-4 py-2 text-white"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border bg-neutral-50 p-4 text-center">
                  <h3 className="font-bold">Restaurant Label</h3>

                  {r.qr_code_data_url ? (
                    <>
                      <div className="mx-auto mt-3 flex w-[300px] flex-col items-center rounded-xl border bg-white p-4 text-black">
                        <img
                          src={r.qr_code_data_url}
                          alt={`${r.restaurant_name} QR Code`}
                          className="h-36 w-36"
                        />

                        <h4 className="mt-3 text-center text-lg font-bold leading-tight">
                          {r.restaurant_name}
                        </h4>

                        <p className="mt-1 text-center text-sm leading-tight">
                          {r.address}
                        </p>

                        <p className="text-center text-sm leading-tight">
                          {r.city}, {r.state} {r.zip_code}
                        </p>

                        <p className="mt-2 text-center text-xs font-semibold">
                          Scan to manage your RoseOut listing
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          const printWindow = window.open("", "_blank");
                          if (!printWindow) return;

                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>${r.restaurant_name} RoseOut Label</title>
                                <style>
                                  body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                                  .label { width: 300px; border: 1px solid #ddd; border-radius: 12px; padding: 16px; text-align: center; }
                                  img { width: 144px; height: 144px; }
                                  h4 { margin: 12px 0 4px; font-size: 18px; line-height: 1.1; }
                                  p { margin: 2px 0; font-size: 14px; line-height: 1.2; }
                                  .small { margin-top: 10px; font-size: 12px; font-weight: bold; }
                                </style>
                              </head>
                              <body>
                                <div class="label">
                                  <img src="${r.qr_code_data_url}" />
                                  <h4>${r.restaurant_name || ""}</h4>
                                  <p>${r.address || ""}</p>
                                  <p>${r.city || ""}, ${r.state || ""} ${r.zip_code || ""}</p>
                                  <p class="small">Scan to manage your RoseOut listing</p>
                                </div>
                                <script>
                                  window.onload = function() { window.print(); };
                                </script>
                              </body>
                            </html>
                          `);

                          printWindow.document.close();
                        }}
                        className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
                      >
                        Download / Print Label
                      </button>
                    </>
                  ) : (
                    <p className="mt-4 text-sm text-neutral-500">
                      No QR generated.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {restaurants.length === 0 && (
            <p className="rounded-2xl bg-white p-6 text-black">
              No restaurant submissions yet.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}