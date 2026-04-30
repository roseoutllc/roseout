"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import BackButton from "@/components/BackButton";

type LocationType = "all" | "restaurants" | "activities";

export default function AdminPage() {
  const supabase = createClient();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [locationType, setLocationType] =
    useState<LocationType>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [r, a] = await Promise.all([
      supabase.from("restaurants").select("*"),
      supabase.from("activities").select("*"),
    ]);

    setRestaurants(r.data || []);
    setActivities(a.data || []);
    setLoading(false);
  };

  const allLocations = useMemo(() => {
    const r = restaurants.map((item) => ({
      ...item,
      type: "Restaurant",
      path: `/admin/restaurants/${item.id}`,
      name: item.restaurant_name,
    }));

    const a = activities.map((item) => ({
      ...item,
      type: "Activity",
      path: `/admin/activities/${item.id}`,
      name: item.activity_name,
    }));

    return [...r, ...a];
  }, [restaurants, activities]);

  const filtered = useMemo(() => {
    return allLocations.filter((l) => {
      return (
        (locationType === "all" ||
          l.type.toLowerCase() === locationType) &&
        l.name?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [allLocations, locationType, search]);

  if (loading) {
    return <div className="p-6">Loading admin dashboard...</div>;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 text-white">
      <BackButton />

      <h1 className="mt-4 text-4xl font-bold">Admin Dashboard</h1>

      {/* Filters */}
      <div className="mt-6 flex gap-4">
        <input
          placeholder="Search..."
          className="rounded-xl px-4 py-2 text-black"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="rounded-xl px-4 py-2 text-black"
          value={locationType}
          onChange={(e) =>
            setLocationType(e.target.value as LocationType)
          }
        >
          <option value="all">All</option>
          <option value="restaurants">Restaurants</option>
          <option value="activities">Activities</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-8 overflow-hidden rounded-3xl bg-white text-black">
        <div className="grid grid-cols-12 bg-neutral-100 px-5 py-4 text-xs font-black uppercase text-neutral-500">
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Address</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Rating</div>
          <div className="col-span-2 text-right">Edit</div>
        </div>

        {filtered.map((location) => (
          <div
            key={location.id}
            className="grid grid-cols-12 items-center border-t px-5 py-5"
          >
            <div className="col-span-3 font-bold">
              {location.name}
            </div>

            <div className="col-span-3 text-sm text-neutral-600">
              {[location.address, location.city, location.state]
                .filter(Boolean)
                .join(", ")}
            </div>

            <div className="col-span-2">{location.type}</div>

            <div className="col-span-2">
              <StarRating score={location.roseout_score} />
            </div>

            <div className="col-span-2 text-right">
              <Link
                href={location.path}
                className="rounded-full bg-black px-4 py-2 text-white"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function StarRating({ score }: { score: number | string }) {
  const raw = Number(score || 0);
  const stars = Math.min((raw / 200) * 5, 5);

  return (
    <div>
      <div className="flex text-lg text-yellow-500">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s}>{stars >= s ? "★" : "☆"}</span>
        ))}
      </div>

      <p className="text-xs text-neutral-500">
        {stars.toFixed(1)} / 5
      </p>
    </div>
  );
}