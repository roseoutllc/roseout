"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function OwnerDashboard() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const update = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const loadRestaurantById = async (restaurantId: string) => {
    setMessage("");

    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .maybeSingle();

    if (error || !data) {
      setMessage("Could not load this restaurant listing.");
      return;
    }

    setRestaurant(data);
    setForm(data);
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

      setUser(user);

      const adminUser = user.user_metadata?.role === "superuser";
      setIsAdmin(adminUser);

      if (adminUser) {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .order("restaurant_name", { ascending: true });

        if (error || !data || data.length === 0) {
          setMessage("No restaurants found.");
          setLoading(false);
          return;
        }

        setRestaurants(data);
        setRestaurant(data[0]);
        setForm(data[0]);
        setLoading(false);
        return;
      }

      const { data: ownerRecord, error: ownerError } = await supabase
        .from("restaurant_owners")
        .select("restaurant_id")
        .eq("user_id", user.id)
        .maybeSingle();

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
    setSaving(true);
    setMessage("");

    if (!user || !restaurant?.id) {
      setMessage("You must be logged in to update this listing.");
      setSaving(false);
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
        is_admin: isAdmin,
        ...form,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to update.");
      setSaving(false);
      return;
    }

    setRestaurant(data.restaurant);
    setForm(data.restaurant);
    setMessage("Saved successfully!");
    setSaving(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        Loading your listing...
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

  const fullAddress = [form.address, form.city, form.state, form.zip_code]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-500">
              RoseOut Owner Portal
            </p>
            <h1 className="mt-1 text-2xl font-black">Listing CMS</h1>
          </div>

          <button
            onClick={saveChanges}
            disabled={saving}
            className="rounded-full bg-yellow-500 px-6 py-3 font-extrabold text-black disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-4xl font-bold">
              {form.restaurant_name || "Unnamed Restaurant"}
            </h2>
            <p className="mt-2 text-neutral-400">
              {isAdmin
                ? "Admin access: manage any restaurant listing."
                : "Manage your public RoseOut restaurant listing."}
            </p>
          </div>

          <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
            {isAdmin ? "Admin Full Access" : "Owner Access"}
          </div>
        </div>

        {isAdmin && restaurants.length > 0 && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
            <label className="text-sm font-bold text-neutral-300">
              Select Restaurant Location
            </label>

            <select
              value={restaurant.id}
              onChange={(e) => loadRestaurantById(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.restaurant_name || "Unnamed Restaurant"} —{" "}
                  {[r.address, r.city, r.state].filter(Boolean).join(", ")}
                </option>
              ))}
            </select>
          </section>
        )}

        {message && (
          <div className="mt-6 rounded-2xl bg-white p-4 font-semibold text-black">
            {message}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 text-black">
              <h3 className="text-2xl font-bold">Basic Information</h3>

              <div className="mt-5 grid gap-4">
                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.restaurant_name || ""}
                  onChange={(e) => update("restaurant_name", e.target.value)}
                  placeholder="Restaurant Name"
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.address || ""}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Street Address"
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    className="rounded-xl border px-4 py-3"
                    value={form.city || ""}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="City"
                  />

                  <input
                    className="rounded-xl border px-4 py-3"
                    value={form.state || ""}
                    onChange={(e) => update("state", e.target.value)}
                    placeholder="State"
                  />

                  <input
                    className="rounded-xl border px-4 py-3"
                    value={form.zip_code || ""}
                    onChange={(e) => update("zip_code", e.target.value)}
                    placeholder="Zip Code"
                  />
                </div>

                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.phone || ""}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="Phone"
                />

                <textarea
                  className="min-h-32 rounded-xl border px-4 py-3"
                  value={form.description || ""}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Description"
                />
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 text-black">
              <h3 className="text-2xl font-bold">Listing Details</h3>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.cuisine_type || ""}
                  onChange={(e) => update("cuisine_type", e.target.value)}
                  placeholder="Cuisine Type"
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.price_range || ""}
                  onChange={(e) => update("price_range", e.target.value)}
                  placeholder="Price Range"
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.atmosphere || ""}
                  onChange={(e) => update("atmosphere", e.target.value)}
                  placeholder="Atmosphere"
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.noise_level || ""}
                  onChange={(e) => update("noise_level", e.target.value)}
                  placeholder="Noise Level"
                />
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 text-black">
              <h3 className="text-2xl font-bold">Links & Social Media</h3>

              <div className="mt-5 grid gap-4">
                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.website || ""}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="Website"
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.reservation_link || ""}
                  onChange={(e) => update("reservation_link", e.target.value)}
                  placeholder="Reservation Link"
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.image_url || ""}
                  onChange={(e) => update("image_url", e.target.value)}
                  placeholder="Image URL"
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.instagram_url || ""}
                  onChange={(e) => update("instagram_url", e.target.value)}
                  placeholder="Instagram URL"
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.facebook_url || ""}
                  onChange={(e) => update("facebook_url", e.target.value)}
                  placeholder="Facebook URL"
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.tiktok_url || ""}
                  onChange={(e) => update("tiktok_url", e.target.value)}
                  placeholder="TikTok URL"
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl bg-white p-6 text-black">
              <h3 className="text-xl font-bold">Listing Preview</h3>

              {form.image_url ? (
                <img
                  src={form.image_url}
                  alt={form.restaurant_name || "Restaurant"}
                  className="mt-4 h-52 w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="mt-4 flex h-52 w-full items-center justify-center rounded-2xl bg-neutral-200 text-sm font-semibold text-neutral-500">
                  No Image
                </div>
              )}

              <h4 className="mt-4 text-2xl font-black">
                {form.restaurant_name || "Unnamed Restaurant"}
              </h4>

              <p className="mt-1 text-sm text-neutral-600">
                {fullAddress || "No address listed"}
              </p>
            </section>

            <section className="rounded-3xl bg-white p-6 text-black">
              <h3 className="text-xl font-bold">Listing Status</h3>

              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <strong>Status:</strong> {form.status || "approved"}
                </p>
                <p>
                  <strong>Claim Status:</strong>{" "}
                  {form.claim_status || "claimed"}
                </p>
                <p>
                  <strong>Featured:</strong>{" "}
                  {form.is_featured ? "Yes" : "No"}
                </p>
              </div>

              <button
                onClick={saveChanges}
                disabled={saving}
                className="mt-5 w-full rounded-xl bg-yellow-500 px-4 py-3 font-black text-black disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Listing"}
              </button>
            </section>
          </aside>
        </div>

        <div className="sticky bottom-0 mt-8 border-t border-white/10 bg-black/95 py-4 backdrop-blur">
          <button
            onClick={saveChanges}
            disabled={saving}
            className="w-full rounded-full bg-yellow-500 px-6 py-4 font-extrabold text-black disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>
    </main>
  );
}