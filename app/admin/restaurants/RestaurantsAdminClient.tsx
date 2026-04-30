"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type Restaurant = {
  id: string;
  restaurant_name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  status?: string;
  cuisine_type?: string;
  price_range?: string;
  atmosphere?: string;
  primary_tag?: string;
  reservation_link?: string;
  website?: string;
  image_url?: string;
  rating?: number;
  review_count?: number;
  roseout_score?: number;
  view_count?: number;
  click_count?: number;
};

export default function RestaurantsAdminClient({
  initialRestaurants,
  loadError,
}: {
  initialRestaurants: Restaurant[];
  loadError: string;
}) {
  const supabase = createClient();

  const [restaurants, setRestaurants] =
    useState<Restaurant[]>(initialRestaurants);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Restaurant>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState(loadError || "");
  const [saving, setSaving] = useState(false);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesSearch =
        r.restaurant_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.city?.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine_type?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [restaurants, search, statusFilter]);

  const startEdit = (restaurant: Restaurant) => {
    setEditingId(restaurant.id);
    setForm({
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
    setMessage("");
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const updateField = (field: keyof Restaurant, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveRestaurant = async (id: string) => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updatePayload = {
        restaurant_name: form.restaurant_name,
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
        status: form.status,
        cuisine_type: form.cuisine_type,
        price_range: form.price_range,
        atmosphere: form.atmosphere,
        primary_tag: form.primary_tag,
        reservation_link: form.reservation_link,
        website: form.website,
        image_url: form.image_url,
        rating: Number(form.rating || 0),
        review_count: Number(form.review_count || 0),
        roseout_score: Number(form.roseout_score || 0),
      };

      const { error: updateError } = await supabase
        .from("restaurants")
        .update(updatePayload)
        .eq("id", id);

      if (updateError) throw updateError;

setRestaurants((prev): Restaurant[] =>
  prev.map((r): Restaurant =>
    r.id === id
      ? {
          ...r,
          restaurant_name: form.restaurant_name ?? r.restaurant_name,
          address: form.address ?? r.address,
          city: form.city ?? r.city,
          state: form.state ?? r.state,
          zip_code: form.zip_code ?? r.zip_code,
          status: form.status ?? r.status,
          phone: form.phone ?? r.phone,
          website: form.website ?? r.website,
          reservation_url: form.reservation_url ?? r.reservation_url,
          cuisine: form.cuisine ?? r.cuisine,
          description: form.description ?? r.description,
          image_url: form.image_url ?? r.image_url,
          roseout_score:
            form.roseout_score === undefined
              ? r.roseout_score
              : Number(form.roseout_score),
          view_count: r.view_count,
          click_count: r.click_count,
        }
      : r
  )
);

      setEditingId(null);
      setForm({});
      setMessage("Restaurant updated successfully.");
    } catch (err: any) {
      setError(err.message || "Could not update restaurant.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-500">
          RoseOut Admin
        </p>

        <h1 className="text-4xl font-extrabold tracking-tight">
          Restaurants Admin
        </h1>

        <p className="mt-3 text-neutral-400">
          Search, edit, approve, and manage restaurant listings.
        </p>
      </div>

      {message && (
        <div className="mb-5 rounded-2xl bg-green-100 p-4 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 text-black">
          <p className="text-xs font-bold uppercase text-neutral-500">Total</p>
          <p className="mt-1 text-3xl font-extrabold">{restaurants.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 text-black">
          <p className="text-xs font-bold uppercase text-neutral-500">
            Approved
          </p>
          <p className="mt-1 text-3xl font-extrabold">
            {restaurants.filter((r) => r.status === "approved").length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 text-black">
          <p className="text-xs font-bold uppercase text-neutral-500">
            Views
          </p>
          <p className="mt-1 text-3xl font-extrabold">
            {restaurants.reduce((sum, r) => sum + Number(r.view_count || 0), 0)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 text-black">
          <p className="text-xs font-bold uppercase text-neutral-500">
            Clicks
          </p>
          <p className="mt-1 text-3xl font-extrabold">
            {restaurants.reduce(
              (sum, r) => sum + Number(r.click_count || 0),
              0
            )}
          </p>
        </div>
      </section>

      <section className="mb-6 rounded-[2rem] bg-white p-5 text-black shadow-xl">
        <div className="grid gap-4 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants, city, cuisine..."
            className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500 md:col-span-2"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-white text-black shadow-2xl">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="text-xl font-bold">Restaurant Listings</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Showing {filteredRestaurants.length} restaurants.
          </p>
        </div>

        <div className="divide-y divide-neutral-200">
          {filteredRestaurants.map((restaurant) => {
            const isEditing = editingId === restaurant.id;

            return (
              <div key={restaurant.id} className="p-5">
                {!isEditing ? (
                  <div className="grid gap-5 md:grid-cols-[120px_1fr_auto]">
                    <div className="h-24 w-full overflow-hidden rounded-2xl bg-neutral-200 md:w-28">
                      {restaurant.image_url ? (
                        <img
                          src={restaurant.image_url}
                          alt={restaurant.restaurant_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-neutral-500">
                          No Image
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-extrabold">
                          {restaurant.restaurant_name}
                        </h3>

                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
                          {restaurant.status || "unknown"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-neutral-600">
                        {restaurant.address}, {restaurant.city},{" "}
                        {restaurant.state} {restaurant.zip_code}
                      </p>

                      <p className="mt-2 text-sm text-neutral-500">
                        {restaurant.cuisine_type || "Cuisine N/A"} ·{" "}
                        {restaurant.price_range || "Price N/A"} · Score:{" "}
                        {restaurant.roseout_score || 0}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full bg-neutral-100 px-3 py-1">
                          Views: {restaurant.view_count || 0}
                        </span>
                        <span className="rounded-full bg-neutral-100 px-3 py-1">
                          Clicks: {restaurant.click_count || 0}
                        </span>
                        <span className="rounded-full bg-neutral-100 px-3 py-1">
                          Rating: {restaurant.rating || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(restaurant)}
                        className="rounded-full bg-yellow-500 px-5 py-2 text-sm font-extrabold text-black"
                      >
                        Edit
                      </button>

                      <a
                        href={`/restaurants/${restaurant.id}`}
                        target="_blank"
                        className="rounded-full bg-black px-5 py-2 text-center text-sm font-extrabold text-white"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="text-xl font-extrabold">
                        Editing Restaurant
                      </h3>

                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-full border border-black px-4 py-2 text-sm font-bold"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        value={form.restaurant_name || ""}
                        onChange={(e) =>
                          updateField("restaurant_name", e.target.value)
                        }
                        placeholder="Restaurant name"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <select
                        value={form.status || "approved"}
                        onChange={(e) => updateField("status", e.target.value)}
                        className="rounded-2xl border px-4 py-3"
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="draft">Draft</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      <input
                        value={form.address || ""}
                        onChange={(e) => updateField("address", e.target.value)}
                        placeholder="Address"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <input
                        value={form.city || ""}
                        onChange={(e) => updateField("city", e.target.value)}
                        placeholder="City"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <input
                        value={form.state || ""}
                        onChange={(e) => updateField("state", e.target.value)}
                        placeholder="State"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <input
                        value={form.zip_code || ""}
                        onChange={(e) =>
                          updateField("zip_code", e.target.value)
                        }
                        placeholder="Zip Code"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <input
                        value={form.cuisine_type || ""}
                        onChange={(e) =>
                          updateField("cuisine_type", e.target.value)
                        }
                        placeholder="Cuisine Type"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <input
                        value={form.price_range || ""}
                        onChange={(e) =>
                          updateField("price_range", e.target.value)
                        }
                        placeholder="Price Range"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <input
                        value={form.atmosphere || ""}
                        onChange={(e) =>
                          updateField("atmosphere", e.target.value)
                        }
                        placeholder="Atmosphere"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <input
                        value={form.primary_tag || ""}
                        onChange={(e) =>
                          updateField("primary_tag", e.target.value)
                        }
                        placeholder="Primary Tag"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <input
                        value={form.rating || 0}
                        onChange={(e) =>
                          updateField("rating", Number(e.target.value))
                        }
                        type="number"
                        step="0.1"
                        placeholder="Rating"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <input
                        value={form.review_count || 0}
                        onChange={(e) =>
                          updateField("review_count", Number(e.target.value))
                        }
                        type="number"
                        placeholder="Review Count"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <input
                        value={form.roseout_score || 0}
                        onChange={(e) =>
                          updateField("roseout_score", Number(e.target.value))
                        }
                        type="number"
                        placeholder="RoseOut Score"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <input
                        value={form.image_url || ""}
                        onChange={(e) =>
                          updateField("image_url", e.target.value)
                        }
                        placeholder="Image URL"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <input
                        value={form.website || ""}
                        onChange={(e) => updateField("website", e.target.value)}
                        placeholder="Website"
                        className="rounded-2xl border px-4 py-3"
                      />

                      <input
                        value={form.reservation_link || ""}
                        onChange={(e) =>
                          updateField("reservation_link", e.target.value)
                        }
                        placeholder="Reservation Link"
                        className="rounded-2xl border px-4 py-3"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => saveRestaurant(restaurant.id)}
                      disabled={saving}
                      className="mt-5 rounded-full bg-yellow-500 px-6 py-3 font-extrabold text-black disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {!filteredRestaurants.length && (
            <div className="p-8 text-center text-neutral-500">
              No restaurants found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}