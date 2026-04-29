"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function RestaurantDashboardPage() {
  const supabase = createClient();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRestaurant = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/restaurants/apply";
      return;
    }

    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_user_id", userData.user.id)
      .single();

    if (error) {
      setMessage("No restaurant listing found for this account.");
      setLoading(false);
      return;
    }

    setRestaurant(data);
    setLoading(false);
  };

  const update = (key: string, value: string) => {
    setRestaurant((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveRestaurant = async () => {
    if (!restaurant?.id) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("restaurants")
      .update({
        restaurant_name: restaurant.restaurant_name,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        zip_code: restaurant.zip_code,
        neighborhood: restaurant.neighborhood,
        cuisine_type: restaurant.cuisine_type,
        price_range: restaurant.price_range,
        reservation_link: restaurant.reservation_link,
        website: restaurant.website,
        phone: restaurant.phone,
        email: restaurant.email,
        instagram_url: restaurant.instagram_url,
        tiktok_url: restaurant.tiktok_url,
        x_url: restaurant.x_url,
        hours_of_operation: restaurant.hours_of_operation,
        kitchen_closing_time: restaurant.kitchen_closing_time,
        lighting: restaurant.lighting,
        noise_level: restaurant.noise_level,
        atmosphere: restaurant.atmosphere,
        description: restaurant.description,
      })
      .eq("id", restaurant.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Your restaurant listing has been updated.");
    setSaving(false);
  };

  const sendLoginLink = async () => {
    if (!restaurant?.email) return;

    setMessage("Sending login link...");

    const res = await fetch("/api/restaurants/send-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: restaurant.email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to send login link.");
      return;
    }

    setMessage("Check your email for a new login link.");
  };

  useEffect(() => {
    loadRestaurant();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        Loading...
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        {message}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold">Restaurant Dashboard</h1>

        <p className="mt-3 text-neutral-400">
          Manage your RoseOut listing details.
        </p>

        <div className="mt-8 rounded-3xl bg-white p-6 text-black">
          <p className="mb-4 rounded-xl bg-yellow-500 px-4 py-3 font-semibold text-black">
            Status: {restaurant.status}
          </p>

          <div className="space-y-4">
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Restaurant Name" value={restaurant.restaurant_name || ""} onChange={(e) => update("restaurant_name", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Street Address" value={restaurant.address || ""} onChange={(e) => update("address", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="City" value={restaurant.city || ""} onChange={(e) => update("city", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="State" value={restaurant.state || ""} onChange={(e) => update("state", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Zip Code" value={restaurant.zip_code || ""} onChange={(e) => update("zip_code", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Neighborhood" value={restaurant.neighborhood || ""} onChange={(e) => update("neighborhood", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Cuisine Type" value={restaurant.cuisine_type || ""} onChange={(e) => update("cuisine_type", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Price Range, example: $$" value={restaurant.price_range || ""} onChange={(e) => update("price_range", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Reservation Link" value={restaurant.reservation_link || ""} onChange={(e) => update("reservation_link", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Website" value={restaurant.website || ""} onChange={(e) => update("website", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Phone" value={restaurant.phone || ""} onChange={(e) => update("phone", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Email" value={restaurant.email || ""} onChange={(e) => update("email", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Instagram URL" value={restaurant.instagram_url || ""} onChange={(e) => update("instagram_url", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="TikTok URL" value={restaurant.tiktok_url || ""} onChange={(e) => update("tiktok_url", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="X URL" value={restaurant.x_url || ""} onChange={(e) => update("x_url", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Hours of Operation" value={restaurant.hours_of_operation || ""} onChange={(e) => update("hours_of_operation", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Kitchen Closing Time" value={restaurant.kitchen_closing_time || ""} onChange={(e) => update("kitchen_closing_time", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Lighting, example: dim, warm, bright" value={restaurant.lighting || ""} onChange={(e) => update("lighting", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Noise Level, example: quiet, moderate, loud" value={restaurant.noise_level || ""} onChange={(e) => update("noise_level", e.target.value)} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Atmosphere, example: cozy, lively, upscale" value={restaurant.atmosphere || ""} onChange={(e) => update("atmosphere", e.target.value)} />

            <textarea
              className="min-h-32 w-full rounded-xl border px-4 py-3"
              placeholder="Description"
              value={restaurant.description || ""}
              onChange={(e) => update("description", e.target.value)}
            />

            <button
              onClick={saveRestaurant}
              disabled={saving}
              className="w-full rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Listing"}
            </button>

            <button
              onClick={sendLoginLink}
              className="w-full rounded-xl bg-black px-6 py-3 font-semibold text-white"
            >
              Send me a new login link
            </button>

            {message && (
              <p className="text-center font-semibold">{message}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}