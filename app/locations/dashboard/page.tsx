"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type LocationType = "restaurant" | "activity";

export default function LocationsDashboard() {
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

  // LOAD DATA
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      const isSuper = user.user_metadata?.role === "superuser";
      setIsAdmin(isSuper);

      // ADMIN LOAD ALL
      if (isSuper) {
        const [restaurants, activities] = await Promise.all([
          supabase.from("restaurants").select("*"),
          supabase.from("activities").select("*"),
        ]);

        const combined = [
          ...(restaurants.data || []).map((r) => ({
            ...r,
            location_type: "restaurant",
            display_name: r.restaurant_name,
          })),
          ...(activities.data || []).map((a) => ({
            ...a,
            location_type: "activity",
            display_name: a.activity_name,
          })),
        ];

        setLocations(combined);
        setSelectedLocation(combined[0]);
        setForm(combined[0]);
        setLoading(false);
        return;
      }

      // OWNER LOAD SINGLE
      const { data: owner } = await supabase
        .from("restaurant_owners")
        .select("restaurant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!owner) {
        setMessage("No location linked yet.");
        setLoading(false);
        return;
      }

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", owner.restaurant_id)
        .single();

      const location = {
        ...restaurant,
        location_type: "restaurant",
        display_name: restaurant.restaurant_name,
      };

      setLocations([location]);
      setSelectedLocation(location);
      setForm(location);
      setLoading(false);
    };

    loadData();
  }, []);

  // FILTER
  const filteredLocations = useMemo(() => {
    return locations.filter((l) => {
      const q = search.toLowerCase();

      return (
        (locationType === "all" || l.location_type === locationType) &&
        (l.display_name?.toLowerCase().includes(q) ||
          l.city?.toLowerCase().includes(q))
      );
    });
  }, [locations, search, locationType]);

  const selectLocation = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    if (!loc) return;
    setSelectedLocation(loc);
    setForm(loc);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading Locations...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-5 py-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Locations Portal</h1>
            <p className="text-neutral-400 text-sm">
              Manage your listings
            </p>
          </div>

          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm border px-4 py-2 rounded-full"
          >
            Logout
          </button>
        </div>

        {/* SEARCH */}
        <div className="mb-6 flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search locations..."
            className="flex-1 rounded-full bg-neutral-900 px-4 py-3"
          />

          <select
            value={locationType}
            onChange={(e) => setLocationType(e.target.value as any)}
            className="rounded-full bg-neutral-900 px-4"
          >
            <option value="all">All</option>
            <option value="restaurant">Restaurants</option>
            <option value="activity">Activities</option>
          </select>
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* LIST */}
          <div className="space-y-4">
            {filteredLocations.map((loc) => (
              <div
                key={loc.id}
                onClick={() => selectLocation(loc.id)}
                className={`p-4 rounded-xl cursor-pointer transition ${
                  selectedLocation?.id === loc.id
                    ? "bg-yellow-500 text-black"
                    : "bg-neutral-900"
                }`}
              >
                <p className="font-bold">{loc.display_name}</p>
                <p className="text-xs">{loc.city}</p>
              </div>
            ))}
          </div>

          {/* DETAILS */}
          <div className="md:col-span-2 bg-white text-black p-6 rounded-2xl shadow-xl">
            {selectedLocation && (
              <>
                <h2 className="text-2xl font-bold mb-4">
                  {selectedLocation.display_name}
                </h2>

                <input
                  value={form.address || ""}
                  onChange={(e) => update("address", e.target.value)}
                  className="w-full mb-3 p-3 border rounded"
                  placeholder="Address"
                />

                <input
                  value={form.city || ""}
                  onChange={(e) => update("city", e.target.value)}
                  className="w-full mb-3 p-3 border rounded"
                  placeholder="City"
                />

                <button
                  onClick={async () => {
                    setSaving(true);

                    const table =
                      selectedLocation.location_type === "restaurant"
                        ? "restaurants"
                        : "activities";

                    await supabase
                      .from(table)
                      .update(form)
                      .eq("id", selectedLocation.id);

                    setSaving(false);
                    setMessage("Saved!");
                  }}
                  className="mt-4 w-full bg-black text-white py-3 rounded-full"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                {message && (
                  <p className="mt-3 text-green-600 font-bold">{message}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}