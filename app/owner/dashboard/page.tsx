"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type LocationType = "restaurant" | "activity";

export default function OwnerDashboard() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [locationType, setLocationType] = useState<"all" | LocationType>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      const adminUser = user.user_metadata?.role === "superuser";
      setIsAdmin(adminUser);

      if (adminUser) {
        const [restaurantResult, activityResult] = await Promise.all([
          supabase.from("restaurants").select("*").order("restaurant_name"),
          supabase.from("activities").select("*").order("activity_name"),
        ]);

        const restaurantLocations =
          restaurantResult.data?.map((r) => ({
            ...r,
            location_type: "restaurant",
            display_name:
              r.restaurant_name || r.name || "Unnamed Restaurant",
          })) || [];

        const activityLocations =
          activityResult.data?.map((a) => ({
            ...a,
            location_type: "activity",
            display_name: a.activity_name || a.name || "Unnamed Activity",
          })) || [];

        const all = [...restaurantLocations, ...activityLocations];

        setLocations(all);
        setSelectedLocation(all[0] || null);
        setForm(all[0] || {});
        setLoading(false);
        return;
      }

      const { data: ownerRecord } = await supabase
        .from("restaurant_owners")
        .select("restaurant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!ownerRecord) {
        setMessage("No location is linked to this account yet.");
        setLoading(false);
        return;
      }

      const { data: restaurantData } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", ownerRecord.restaurant_id)
        .maybeSingle();

      if (!restaurantData) {
        setMessage("Could not load your listing.");
        setLoading(false);
        return;
      }

      const location = {
        ...restaurantData,
        location_type: "restaurant",
        display_name:
          restaurantData.restaurant_name || "Unnamed Restaurant",
      };

      setLocations([location]);
      setSelectedLocation(location);
      setForm(location);
      setLoading(false);
    };

    loadData();
  }, []);

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const query = search.toLowerCase();

      const matchesType =
        locationType === "all" || location.location_type === locationType;

      const matchesSearch =
        location.display_name?.toLowerCase().includes(query) ||
        location.address?.toLowerCase().includes(query) ||
        location.city?.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [locations, search, locationType]);

  const selectLocation = (id: string) => {
    const location = locations.find((item) => item.id === id);
    if (!location) return;

    setSelectedLocation(location);
    setForm(location);
    setMessage("");
  };

  const saveChanges = async () => {
    setSaving(true);
    setMessage("");

    if (!user || !selectedLocation?.id) {
      setMessage("You must be logged in to update this listing.");
      setSaving(false);
      return;
    }

    const endpoint =
      selectedLocation.location_type === "restaurant"
        ? "/api/owner/restaurant/update"
        : "/api/owner/activity/update";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
        location_id: selectedLocation.id,
        restaurant_id: selectedLocation.id,
        activity_id: selectedLocation.id,
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

    const updatedLocation = {
      ...(data.restaurant || data.activity),
      location_type: selectedLocation.location_type,
      display_name:
        data.restaurant?.restaurant_name ||
        data.activity?.activity_name ||
        form.display_name,
    };

    setSelectedLocation(updatedLocation);
    setForm(updatedLocation);

    setLocations((prev) =>
      prev.map((item) =>
        item.id === updatedLocation.id &&
        item.location_type === updatedLocation.location_type
          ? updatedLocation
          : item
      )
    );

    setMessage("Saved successfully!");
    setSaving(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        Loading your listings...
      </main>
    );
  }

  if (!selectedLocation) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        {message || "No location linked to your account."}
      </main>
    );
  }

  const isRestaurant = selectedLocation.location_type === "restaurant";

  const nameField = isRestaurant ? "restaurant_name" : "activity_name";

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
            <h1 className="mt-1 text-2xl font-black">Location CMS</h1>
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
              {form[nameField] || "Unnamed Location"}
            </h2>

            <p className="mt-2 text-neutral-400">
              {isAdmin
                ? "Admin access: manage restaurants and activity locations."
                : "Manage your public RoseOut listing."}
            </p>
          </div>

          <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
            {isAdmin ? "Admin Full Access" : "Owner Access"}
          </div>
        </div>

        {isAdmin && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search restaurants or activity locations..."
                className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white outline-none placeholder:text-neutral-500"
              />

              <select
                value={locationType}
                onChange={(e) =>
                  setLocationType(e.target.value as "all" | LocationType)
                }
                className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
              >
                <option value="all">All Locations</option>
                <option value="restaurant">Restaurants</option>
                <option value="activity">Activity Locations</option>
              </select>

              <select
                value={selectedLocation.id}
                onChange={(e) => selectLocation(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
              >
                {filteredLocations.map((location) => (
                  <option key={`${location.location_type}-${location.id}`} value={location.id}>
                    {location.location_type === "restaurant"
                      ? "Restaurant"
                      : "Activity"}{" "}
                    — {location.display_name}
                  </option>
                ))}
              </select>
            </div>
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
                  value={form[nameField] || ""}
                  onChange={(e) => update(nameField, e.target.value)}
                  placeholder={isRestaurant ? "Restaurant Name" : "Activity Name"}
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
              <h3 className="text-2xl font-bold">
                {isRestaurant ? "Restaurant Details" : "Activity Details"}
              </h3>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {isRestaurant ? (
                  <>
                    <input
                      className="rounded-xl border px-4 py-3"
                      value={form.cuisine_type || ""}
                      onChange={(e) => update("cuisine_type", e.target.value)}
                      placeholder="Cuisine Type"
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
                  </>
                ) : (
                  <>
                    <input
                      className="rounded-xl border px-4 py-3"
                      value={form.activity_type || ""}
                      onChange={(e) => update("activity_type", e.target.value)}
                      placeholder="Activity Type"
                    />

                    <input
                      className="rounded-xl border px-4 py-3"
                      value={form.best_for || ""}
                      onChange={(e) => update("best_for", e.target.value)}
                      placeholder="Best For"
                    />

                    <input
                      className="rounded-xl border px-4 py-3"
                      value={form.duration || ""}
                      onChange={(e) => update("duration", e.target.value)}
                      placeholder="Duration"
                    />
                  </>
                )}

                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.price_range || ""}
                  onChange={(e) => update("price_range", e.target.value)}
                  placeholder="Price Range"
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
                  value={form.reservation_link || form.booking_link || ""}
                  onChange={(e) =>
                    update(isRestaurant ? "reservation_link" : "booking_link", e.target.value)
                  }
                  placeholder={isRestaurant ? "Reservation Link" : "Booking Link"}
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
                  alt={form[nameField] || "Location"}
                  className="mt-4 h-52 w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="mt-4 flex h-52 w-full items-center justify-center rounded-2xl bg-neutral-200 text-sm font-semibold text-neutral-500">
                  No Image
                </div>
              )}

              <h4 className="mt-4 text-2xl font-black">
                {form[nameField] || "Unnamed Location"}
              </h4>

              <p className="mt-1 text-sm text-neutral-600">
                {fullAddress || "No address listed"}
              </p>
            </section>

            <section className="rounded-3xl bg-white p-6 text-black">
              <h3 className="text-xl font-bold">Listing Status</h3>

              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <strong>Type:</strong>{" "}
                  {isRestaurant ? "Restaurant" : "Activity Location"}
                </p>

                <p>
                  <strong>Status:</strong> {form.status || "approved"}
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