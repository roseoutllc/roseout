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
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      const { data: ownerRecord, error: ownerError } = await supabase
        .from("restaurant_owners")
        .select("restaurant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("OWNER RECORD:", ownerRecord);
      console.log("OWNER ERROR:", ownerError);

      if (ownerError || !ownerRecord) {
        setMessage("No restaurant is linked to this account yet.");
        setLoading(false);
        return;
      }

      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", ownerRecord.restaurant_id)
        .maybeSingle();

      console.log("RESTAURANT DATA:", restaurantData);
      console.log("RESTAURANT ERROR:", restaurantError);

      if (restaurantError || !restaurantData) {
        setMessage("Could not load your restaurant listing.");
        setLoading(false);
        return;
      }

      setRestaurant(restaurantData);
      setForm(restaurantData);
      setLoading(false);
    };

    loadData();
  }, []);

  const saveChanges = async () => {
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !restaurant?.id) {
      setMessage("You must be logged in to update this listing.");
      return;
    }

    const res = await fetch("/api/owner/restaurant/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
        restaurant_id: restaurant.id,
        ...form,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to update.");
      return;
    }

    setRestaurant(data.restaurant);
    setForm(data.restaurant);
    setMessage("Saved successfully!");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        Loading...
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        {message || "No restaurant linked to your account."}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-500">
          RoseOut
        </p>

        <h1 className="mt-3 text-4xl font-bold">Manage Your Listing</h1>

        <p className="mt-3 text-neutral-400">
          Updating:{" "}
          <span className="font-semibold text-white">
            {restaurant.restaurant_name || "Unnamed Restaurant"}
          </span>
        </p>

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

          <div className="grid gap-4 md:grid-cols-3">
            <input
              className="w-full rounded-xl border px-4 py-3"
              value={form.city || ""}
              onChange={(e) => update("city", e.target.value)}
              placeholder="City"
            />

            <input
              className="w-full rounded-xl border px-4 py-3"
              value={form.state || ""}
              onChange={(e) => update("state", e.target.value)}
              placeholder="State"
            />

            <input
              className="w-full rounded-xl border px-4 py-3"
              value={form.zip_code || ""}
              onChange={(e) => update("zip_code", e.target.value)}
              placeholder="Zip Code"
            />
          </div>

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

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={form.reservation_link || ""}
            onChange={(e) => update("reservation_link", e.target.value)}
            placeholder="Reservation Link"
          />

          <textarea
            className="min-h-28 w-full rounded-xl border px-4 py-3"
            value={form.description || ""}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Description"
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={form.cuisine_type || ""}
            onChange={(e) => update("cuisine_type", e.target.value)}
            placeholder="Cuisine Type"
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={form.price_range || ""}
            onChange={(e) => update("price_range", e.target.value)}
            placeholder="Price Range"
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={form.atmosphere || ""}
            onChange={(e) => update("atmosphere", e.target.value)}
            placeholder="Atmosphere"
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={form.noise_level || ""}
            onChange={(e) => update("noise_level", e.target.value)}
            placeholder="Noise Level"
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={form.image_url || ""}
            onChange={(e) => update("image_url", e.target.value)}
            placeholder="Image URL"
          />

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

          {message && <p className="text-center font-semibold">{message}</p>}
        </div>
      </div>
    </main>
  );
}