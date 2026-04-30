"use client";

import { useEffect, useMemo, useState } from "react";

type Restaurant = {
  id: string;
  restaurant_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  status: string;
  phone?: string | null;
  website?: string | null;
  reservation_url?: string | null;
  cuisine?: string | null;
  description?: string | null;
  image_url?: string | null;
  roseout_score?: number | null;
  view_count?: number | null;
  click_count?: number | null;
  created_at?: string | null;
};

type RestaurantForm = Partial<Restaurant>;

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RestaurantForm>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/restaurants", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load restaurants");
      }

      setRestaurants(data.restaurants || []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load restaurants.");
    } finally {
      setLoading(false);
    }
  }

  function startEditing(restaurant: Restaurant) {
    setEditingId(restaurant.id);
    setMessage("");
    setForm({
      restaurant_name: restaurant.restaurant_name,
      address: restaurant.address,
      city: restaurant.city,
      state: restaurant.state,
      zip_code: restaurant.zip_code,
      status: restaurant.status,
      phone: restaurant.phone ?? "",
      website: restaurant.website ?? "",
      reservation_url: restaurant.reservation_url ?? "",
      cuisine: restaurant.cuisine ?? "",
      description: restaurant.description ?? "",
      image_url: restaurant.image_url ?? "",
      roseout_score: restaurant.roseout_score ?? 0,
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm({});
    setMessage("");
  }

  function updateForm(field: keyof Restaurant, value: string | number) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveRestaurant(id: string) {
    try {
      setSaving(true);
      setMessage("");

      const payload = {
        restaurant_name: form.restaurant_name,
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
        status: form.status,
        phone: form.phone,
        website: form.website,
        reservation_url: form.reservation_url,
        cuisine: form.cuisine,
        description: form.description,
        image_url: form.image_url,
        roseout_score:
          form.roseout_score === undefined || form.roseout_score === null
            ? null
            : Number(form.roseout_score),
      };

      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update restaurant");
      }

      setRestaurants((prev) =>
        prev.map((r) =>
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
              }
            : r
        )
      );

      setEditingId(null);
      setForm({});
      setMessage("Restaurant updated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        restaurant.restaurant_name.toLowerCase().includes(searchText) ||
        restaurant.city.toLowerCase().includes(searchText) ||
        restaurant.state.toLowerCase().includes(searchText) ||
        restaurant.cuisine?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "all" || restaurant.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [restaurants, search, statusFilter]);

  return (
    <main className="min-h-screen bg-[#fff8f1] px-6 py-8 text-[#2b1a12]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b66a3c]">
              RoseOut Admin
            </p>
            <h1 className="mt-2 text-4xl font-bold">Restaurants CMS</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#6f5c50]">
              View, search, filter, and edit restaurant listings from your admin
              dashboard.
            </p>
          </div>

          <button
            onClick={loadRestaurants}
            className="rounded-full bg-[#2b1a12] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-4 rounded-3xl border border-[#ead8c7] bg-white p-5 shadow-sm md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants..."
            className="rounded-2xl border border-[#ead8c7] px-4 py-3 text-sm outline-none focus:border-[#b66a3c]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-[#ead8c7] px-4 py-3 text-sm outline-none focus:border-[#b66a3c]"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>

          <div className="flex items-center rounded-2xl bg-[#fff8f1] px-4 py-3 text-sm font-semibold text-[#6f5c50]">
            {filteredRestaurants.length} restaurant
            {filteredRestaurants.length === 1 ? "" : "s"} found
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-[#ead8c7] bg-white px-5 py-4 text-sm font-medium text-[#6f5c50]">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-[#ead8c7] bg-white p-8 text-center shadow-sm">
            Loading restaurants...
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredRestaurants.map((restaurant) => {
              const isEditing = editingId === restaurant.id;

              return (
                <div
                  key={restaurant.id}
                  className="rounded-3xl border border-[#ead8c7] bg-white p-5 shadow-sm"
                >
                  {!isEditing ? (
                    <div className="grid gap-5 lg:grid-cols-[140px_1fr_auto]">
                      <div className="h-32 w-full overflow-hidden rounded-2xl bg-[#f4e5d8] lg:w-32">
                        {restaurant.image_url ? (
                          <img
                            src={restaurant.image_url}
                            alt={restaurant.restaurant_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-[#8a7568]">
                            No Image
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-bold">
                            {restaurant.restaurant_name}
                          </h2>
                          <span className="rounded-full bg-[#fff0e3] px-3 py-1 text-xs font-semibold capitalize text-[#b66a3c]">
                            {restaurant.status}
                          </span>
                        </div>

                        <p className="text-sm text-[#6f5c50]">
                          {restaurant.address}, {restaurant.city},{" "}
                          {restaurant.state} {restaurant.zip_code}
                        </p>

                        <p className="mt-2 text-sm text-[#6f5c50]">
                          {restaurant.cuisine || "No cuisine listed"}
                        </p>

                        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6f5c50]">
                          {restaurant.description || "No description added."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-[#6f5c50]">
                          <span>
                            RoseOut Score: {restaurant.roseout_score ?? 0}
                          </span>
                          <span>Views: {restaurant.view_count ?? 0}</span>
                          <span>Clicks: {restaurant.click_count ?? 0}</span>
                        </div>
                      </div>

                      <div className="flex items-start justify-end">
                        <button
                          onClick={() => startEditing(restaurant)}
                          className="rounded-full bg-[#2b1a12] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-2xl font-bold">
                          Edit Restaurant
                        </h2>
                        <div className="flex gap-2">
                          <button
                            onClick={cancelEditing}
                            className="rounded-full border border-[#ead8c7] px-5 py-3 text-sm font-semibold text-[#2b1a12]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveRestaurant(restaurant.id)}
                            disabled={saving}
                            className="rounded-full bg-[#b66a3c] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          label="Restaurant Name"
                          value={form.restaurant_name ?? ""}
                          onChange={(value) =>
                            updateForm("restaurant_name", value)
                          }
                        />

                        <Input
                          label="Cuisine"
                          value={form.cuisine ?? ""}
                          onChange={(value) => updateForm("cuisine", value)}
                        />

                        <Input
                          label="Address"
                          value={form.address ?? ""}
                          onChange={(value) => updateForm("address", value)}
                        />

                        <Input
                          label="City"
                          value={form.city ?? ""}
                          onChange={(value) => updateForm("city", value)}
                        />

                        <Input
                          label="State"
                          value={form.state ?? ""}
                          onChange={(value) => updateForm("state", value)}
                        />

                        <Input
                          label="Zip Code"
                          value={form.zip_code ?? ""}
                          onChange={(value) => updateForm("zip_code", value)}
                        />

                        <Input
                          label="Phone"
                          value={form.phone ?? ""}
                          onChange={(value) => updateForm("phone", value)}
                        />

                        <Input
                          label="Website"
                          value={form.website ?? ""}
                          onChange={(value) => updateForm("website", value)}
                        />

                        <Input
                          label="Reservation Link"
                          value={form.reservation_url ?? ""}
                          onChange={(value) =>
                            updateForm("reservation_url", value)
                          }
                        />

                        <Input
                          label="Image URL"
                          value={form.image_url ?? ""}
                          onChange={(value) => updateForm("image_url", value)}
                        />

                        <Input
                          label="RoseOut Score"
                          type="number"
                          value={String(form.roseout_score ?? 0)}
                          onChange={(value) =>
                            updateForm("roseout_score", Number(value))
                          }
                        />

                        <div>
                          <label className="mb-2 block text-sm font-semibold">
                            Status
                          </label>
                          <select
                            value={form.status ?? "pending"}
                            onChange={(e) =>
                              updateForm("status", e.target.value)
                            }
                            className="w-full rounded-2xl border border-[#ead8c7] px-4 py-3 text-sm outline-none focus:border-[#b66a3c]"
                          >
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                            <option value="draft">Draft</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-semibold">
                          Description
                        </label>
                        <textarea
                          value={form.description ?? ""}
                          onChange={(e) =>
                            updateForm("description", e.target.value)
                          }
                          rows={5}
                          className="w-full rounded-2xl border border-[#ead8c7] px-4 py-3 text-sm outline-none focus:border-[#b66a3c]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredRestaurants.length === 0 && (
              <div className="rounded-3xl border border-[#ead8c7] bg-white p-8 text-center text-sm text-[#6f5c50] shadow-sm">
                No restaurants found.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#ead8c7] px-4 py-3 text-sm outline-none focus:border-[#b66a3c]"
      />
    </div>
  );
}