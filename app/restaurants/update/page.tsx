"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import RestaurantTopBar from "@/app/restaurants/components/RestaurantTopBar";

export default function RestaurantUpdatePage() {
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
      setMessage("No restaurant listing found.");
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
      .update(restaurant)
      .eq("id", restaurant.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Saved successfully.");
    setSaving(false);
  };

  useEffect(() => {
    loadRestaurant();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <RestaurantTopBar />
        <div className="px-6 py-12">Loading...</div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-black text-white">
        <RestaurantTopBar />
        <div className="px-6 py-12">{message}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <RestaurantTopBar />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <a href="/restaurants/dashboard" className="underline">
          ← Back to Dashboard
        </a>

        <h1 className="mt-6 text-4xl font-bold">Edit Listing</h1>

        <div className="mt-8 space-y-4 rounded-3xl bg-white p-6 text-black">
          <input className="w-full rounded-xl border px-4 py-3" value={restaurant.restaurant_name || ""} onChange={(e) => update("restaurant_name", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" value={restaurant.address || ""} onChange={(e) => update("address", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" value={restaurant.city || ""} onChange={(e) => update("city", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" value={restaurant.state || ""} onChange={(e) => update("state", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" value={restaurant.zip_code || ""} onChange={(e) => update("zip_code", e.target.value)} />

          <textarea
            className="min-h-32 w-full rounded-xl border px-4 py-3"
            value={restaurant.description || ""}
            onChange={(e) => update("description", e.target.value)}
          />

          <button
            onClick={saveRestaurant}
            disabled={saving}
            className="w-full rounded-xl bg-yellow-500 px-6 py-3 font-bold"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {message && <p className="text-center font-semibold">{message}</p>}
        </div>
      </div>
    </main>
  );
}