"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function RestaurantEditClient({ restaurant }: any) {
  const supabase = createClient();

  const [form, setForm] = useState({
    restaurant_name: restaurant.restaurant_name || "",
    address: restaurant.address || "",
    city: restaurant.city || "",
    state: restaurant.state || "",
    zip_code: restaurant.zip_code || "",
    status: restaurant.status || "approved",
    cuisine_type: restaurant.cuisine_type || "",
    price_range: restaurant.price_range || "",
    atmosphere: restaurant.atmosphere || "",
    primary_tag: restaurant.primary_tag || "",
    reservation_link: restaurant.reservation_link || "",
    website: restaurant.website || "",
    image_url: restaurant.image_url || "",
    rating: restaurant.rating || 0,
    review_count: restaurant.review_count || 0,
    roseout_score: restaurant.roseout_score || 0,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveRestaurant = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...form,
        rating: Number(form.rating || 0),
        review_count: Number(form.review_count || 0),
        roseout_score: Number(form.roseout_score || 0),
      };

      const { error: updateError } = await supabase
        .from("restaurants")
        .update(payload)
        .eq("id", restaurant.id);

      if (updateError) throw updateError;

      setMessage("Restaurant updated successfully.");
    } catch (err: any) {
      setError(err.message || "Could not update restaurant.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <a
        href="/admin/restaurants"
        className="mb-6 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
      >
        ← Back to Restaurants
      </a>

      <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-500">
        RoseOut Admin
      </p>

      <h1 className="text-4xl font-extrabold tracking-tight">
        Edit Restaurant
      </h1>

      <p className="mt-3 text-neutral-400">
        Update listing details, images, links, and scoring.
      </p>

      {message && (
        <div className="mt-6 rounded-2xl bg-green-100 p-4 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[2rem] bg-white p-6 text-black shadow-2xl">
          <h2 className="text-2xl font-extrabold">Restaurant Details</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-bold">Restaurant Name</label>
              <input
                value={form.restaurant_name}
                onChange={(e) =>
                  updateField("restaurant_name", e.target.value)
                }
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Status</label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold">Cuisine Type</label>
              <input
                value={form.cuisine_type}
                onChange={(e) => updateField("cuisine_type", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Address</label>
              <input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">City</label>
              <input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">State</label>
              <input
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Zip Code</label>
              <input
                value={form.zip_code}
                onChange={(e) => updateField("zip_code", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Price Range</label>
              <input
                value={form.price_range}
                onChange={(e) => updateField("price_range", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Atmosphere</label>
              <input
                value={form.atmosphere}
                onChange={(e) => updateField("atmosphere", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Primary Tag</label>
              <input
                value={form.primary_tag}
                onChange={(e) => updateField("primary_tag", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Rating</label>
              <input
                type="number"
                step="0.1"
                value={form.rating}
                onChange={(e) => updateField("rating", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Review Count</label>
              <input
                type="number"
                value={form.review_count}
                onChange={(e) => updateField("review_count", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">RoseOut Score</label>
              <input
                type="number"
                value={form.roseout_score}
                onChange={(e) => updateField("roseout_score", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-bold">Image URL</label>
              <input
                value={form.image_url}
                onChange={(e) => updateField("image_url", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Website</label>
              <input
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Reservation Link</label>
              <input
                value={form.reservation_link}
                onChange={(e) =>
                  updateField("reservation_link", e.target.value)
                }
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={saveRestaurant}
            disabled={saving}
            className="mt-6 w-full rounded-full bg-yellow-500 px-6 py-4 font-extrabold text-black disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Restaurant"}
          </button>
        </div>

        <aside className="rounded-[2rem] bg-white p-6 text-black shadow-2xl">
          <h2 className="text-2xl font-extrabold">Preview</h2>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-neutral-200">
            {form.image_url ? (
              <img
                src={form.image_url}
                alt={form.restaurant_name}
                className="h-52 w-full object-cover"
              />
            ) : (
              <div className="flex h-52 items-center justify-center bg-neutral-200 text-neutral-500">
                No image
              </div>
            )}

            <div className="p-5">
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
                {form.status}
              </span>

              <h3 className="mt-4 text-2xl font-extrabold">
                {form.restaurant_name || "Restaurant Name"}
              </h3>

              <p className="mt-2 text-sm text-neutral-600">
                {form.city || "City"}, {form.state || "State"}
              </p>

              <p className="mt-3 text-sm text-neutral-500">
                {form.cuisine_type || "Cuisine"} · Score:{" "}
                {form.roseout_score || 0}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <a
              href={`/restaurants/${restaurant.id}`}
              target="_blank"
              className="rounded-full bg-black px-5 py-3 text-center font-bold text-white"
            >
              View Public Page
            </a>
          </div>
        </aside>
      </section>
    </div>
  );
}