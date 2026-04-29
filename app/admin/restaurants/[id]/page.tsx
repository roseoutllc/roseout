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
      setMessage(data.error || "Failed to load.");
      setLoading(false);
      return;
    }

    setRestaurant(data.restaurant);
    setLoading(false);
  };

  const updateRestaurant = async (updates: any) => {
    setMessage("");

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

    setMessage("Updated successfully.");
    loadRestaurant();
  };

  const sendLoginLink = async () => {
    if (!restaurant?.email) {
      setMessage("No email found.");
      return;
    }

    setMessage("Sending login link...");

    const res = await fetch("/api/admin/send-restaurant-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: restaurant.email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to send.");
      return;
    }

    setMessage("Login link sent.");
  };

  const printLabel = () => {
    if (!restaurant) return;

    const win = window.open("", "_blank");
    if (!win) return;

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
          </style>
        </head>
        <body>
          <div class="label">
            <img src="${restaurant.qr_code_data_url || ""}" />
            <div>
              <h2>${restaurant.restaurant_name}</h2>
              <p>${restaurant.address || ""}</p>
              <p>${restaurant.city || ""}, ${restaurant.state || ""} ${restaurant.zip_code || ""}</p>
              <p><strong>Scan to manage listing</strong></p>
            </div>
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  useEffect(() => {
    const init = async () => {
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

      loadRestaurant();
    };

    init();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <AdminTopBar />
        <div className="p-6">Loading...</div>
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-black text-white">
        <AdminTopBar />
        <div className="p-6">Not authorized</div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-black text-white">
        <AdminTopBar />
        <div className="p-6">{message}</div>
      </main>
    );
  }

  const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent(
    `${restaurant.address || ""} ${restaurant.city || ""}`
  )}`;

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminTopBar />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <a href="/admin/restaurants" className="underline">
          ← Back
        </a>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
          
          {/* LEFT */}
          <div className="rounded-3xl bg-white p-6 text-black">
            <h1 className="text-3xl font-bold">
              {restaurant.restaurant_name}
            </h1>

            <p className="mt-2 text-neutral-600">
              {restaurant.address}, {restaurant.city}, {restaurant.state}
            </p>

            <p className="mt-4">
              <strong>Status:</strong> {restaurant.status}
            </p>

            <p className="mt-2">
              <strong>Featured:</strong>{" "}
              {restaurant.is_featured ? "Yes" : "No"}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => updateRestaurant({ status: "approved" })} className="bg-green-600 px-4 py-2 rounded text-white">
                Approve
              </button>

              <button onClick={() => updateRestaurant({ status: "rejected" })} className="bg-red-600 px-4 py-2 rounded text-white">
                Reject
              </button>

              <button onClick={() => updateRestaurant({ is_featured: !restaurant.is_featured })} className="bg-yellow-500 px-4 py-2 rounded text-black">
                Toggle Featured
              </button>

              <button onClick={sendLoginLink} className="bg-blue-600 px-4 py-2 rounded text-white">
                Send Login Link
              </button>

              <a href={mapsLink} target="_blank">
                <button className="bg-black px-4 py-2 rounded text-white">
                  Maps
                </button>
              </a>
            </div>

            {message && (
              <p className="mt-4 bg-neutral-100 p-3 rounded">
                {message}
              </p>
            )}
          </div>

          {/* QR */}
          <div className="rounded-3xl bg-white p-6 text-black text-center">
            <h2 className="text-xl font-bold">QR Label</h2>

            {restaurant.qr_code_data_url && (
              <>
                <img
                  src={restaurant.qr_code_data_url}
                  className="mx-auto mt-4 h-40 w-40"
                />

                <button
                  onClick={printLabel}
                  className="mt-4 w-full bg-black text-white px-4 py-2 rounded"
                >
                  Print Label
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}