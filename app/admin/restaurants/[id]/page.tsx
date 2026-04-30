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

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (unauthorized) return <div className="p-6 text-white">Not authorized</div>;
  if (!restaurant) return <div className="p-6 text-white">{message}</div>;

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminTopBar />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <a href="/admin/restaurants" className="underline">
          ← Back
        </a>

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          {/* MAIN DETAILS */}
          <div className="rounded-3xl bg-white p-6 text-black">
            <h1 className="text-3xl font-bold">
              {restaurant.restaurant_name || "Unnamed Restaurant"}
            </h1>

            <p className="mt-2 text-neutral-600">
              {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip_code}
            </p>

            <div className="mt-6 space-y-2 text-sm">
              <p><strong>Status:</strong> {restaurant.status}</p>
              <p><strong>Claim Status:</strong> {restaurant.claim_status}</p>
              <p><strong>Owner Email:</strong> {restaurant.claimed_by_email || "—"}</p>
              <p><strong>Phone:</strong> {restaurant.phone || "—"}</p>
              <p><strong>Website:</strong> {restaurant.website || "—"}</p>
              <p><strong>Reservation Link:</strong> {restaurant.reservation_link || "—"}</p>
              <p><strong>Price Range:</strong> {restaurant.price_range || "—"}</p>
              <p><strong>Cuisine:</strong> {restaurant.cuisine_type || "—"}</p>
              <p><strong>Atmosphere:</strong> {restaurant.atmosphere || "—"}</p>
              <p><strong>Noise Level:</strong> {restaurant.noise_level || "—"}</p>
            </div>

            <div className="mt-6">
              <p className="font-bold">Description</p>
              <p className="mt-2 text-sm text-neutral-700">
                {restaurant.description || "No description provided"}
              </p>
            </div>
          </div>

          {/* SOCIAL + SCORES */}
          <div className="rounded-3xl bg-white p-6 text-black">
            <h2 className="text-xl font-bold">Social Media</h2>

            <div className="mt-4 space-y-2 text-sm">
              <p>Instagram: {restaurant.instagram_url || "—"}</p>
              <p>Facebook: {restaurant.facebook_url || "—"}</p>
              <p>TikTok: {restaurant.tiktok_url || "—"}</p>
            </div>

            <h2 className="mt-6 text-xl font-bold">Scores</h2>

            <div className="mt-4 space-y-2 text-sm">
              <p>Rating: {restaurant.rating || "—"}</p>
              <p>Reviews: {restaurant.review_count || "—"}</p>
              <p>Quality Score: {restaurant.quality_score || "—"}</p>
              <p>Popularity Score: {restaurant.popularity_score || "—"}</p>
            </div>

            {restaurant.image_url && (
              <img
                src={restaurant.image_url}
                className="mt-6 rounded-xl"
              />
            )}
          </div>

          {/* QR */}
          <div className="rounded-3xl bg-white p-6 text-black text-center col-span-2">
            <h2 className="text-xl font-bold">QR Code</h2>

            {restaurant.qr_code_data_url && (
              <img
                src={restaurant.qr_code_data_url}
                className="mx-auto mt-4 h-48 w-48"
              />
            )}

            <p className="mt-3 text-xs break-all">
              {restaurant.claim_url}
            </p>
          </div>

          {/* ACTIONS */}
          <div className="rounded-3xl bg-white p-6 text-black col-span-2">
            <h2 className="text-xl font-bold">Actions</h2>

            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => updateRestaurant({ status: "approved" })} className="bg-green-600 px-4 py-2 rounded text-white">
                Approve
              </button>

              <button onClick={() => updateRestaurant({ status: "rejected" })} className="bg-red-600 px-4 py-2 rounded text-white">
                Reject
              </button>

              <button onClick={() => updateRestaurant({ is_featured: !restaurant.is_featured })} className="bg-yellow-500 px-4 py-2 rounded text-black">
                Toggle Featured
              </button>
            </div>

            {message && (
              <p className="mt-4 bg-neutral-100 p-3 rounded">
                {message}
              </p>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}