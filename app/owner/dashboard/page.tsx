"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function OwnerDashboard() {
  const supabase = createClient();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const update = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // 🔥 Get restaurant owned by this user
      const { data: ownerRecord } = await supabase
        .from("restaurant_owners")
        .select("restaurant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!ownerRecord) {
        setLoading(false);
        return;
      }

      const { data: restaurantData } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", ownerRecord.restaurant_id)
        .maybeSingle();

      setRestaurant(restaurantData);
      setForm(restaurantData || {});
      setLoading(false);
    };

    loadData();
  }, []);

  const saveChanges = async () => {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const res = await fetch("/api/owner/restaurant/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user?.id,
        restaurant_id: restaurant.id,
        ...form,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to update.");
      return;
    }

    setMessage("Saved successfully!");
  };

  if (loading) {
    return <main className="min-h-screen bg-black p-6 text-white">Loading...</main>;
  }

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        No restaurant linked to your account.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold">Manage Your Listing</h1>

        <div className="mt-8 space-y-4 rounded-3xl bg-white p-6 text-black">
          <input
            className="w-full rounded-xl border px-4 py-3"
            value={form.restaurant_name || ""}
            onChange={(e) => update("restaurant_name", e.target.value)}
            placeholder="Restaurant Name"
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={form.address || ""}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Address"
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={form.phone || ""}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="Phone"
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={form.website || ""}
            onChange={(e) => update("website", e.target.value)}
            placeholder="Website"
          />

          <textarea
            className="w-full rounded-xl border px-4 py-3"
            value={form.description || ""}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Description"
          />

          {/* 🔥 SOCIAL MEDIA */}
          <input
            className="w-full rounded-xl border px-4 py-3"
            value={form.instagram_url || ""}
            onChange={(e) => update("instagram_url", e.target.value)}
            placeholder="Instagram URL"
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={form.facebook_url || ""}
            onChange={(e) => update("facebook_url", e.target.value)}
            placeholder="Facebook URL"
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={form.tiktok_url || ""}
            onChange={(e) => update("tiktok_url", e.target.value)}
            placeholder="TikTok URL"
          />

          <button
            onClick={saveChanges}
            className="w-full rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black"
          >
            Save Changes
          </button>

          {message && (
            <p className="text-center font-semibold">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}