"use client";

import { useEffect, useState } from "react";

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);

  const fetchRestaurants = async () => {
    const res = await fetch("/api/admin/restaurants");
    const data = await res.json();
    setRestaurants(data.restaurants || []);
  };

  const approveRestaurant = async (id: string) => {
    await fetch("/api/admin/restaurants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "approved" }),
    });

    fetchRestaurants();
  };

  const rejectRestaurant = async (id: string) => {
    await fetch("/api/admin/restaurants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "rejected" }),
    });

    fetchRestaurants();
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold">Restaurant Approvals</h1>

        <div className="mt-8 space-y-4">
          {restaurants.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl bg-white p-4 text-black"
            >
              <h2 className="text-xl font-bold">{r.restaurant_name}</h2>

              <p className="text-sm text-neutral-600">
                {r.address}, {r.city}, {r.state}
              </p>

              <p className="mt-2">{r.description}</p>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => approveRestaurant(r.id)}
                  className="rounded-xl bg-green-500 px-4 py-2 text-white"
                >
                  Approve
                </button>

                <button
                  onClick={() => rejectRestaurant(r.id)}
                  className="rounded-xl bg-red-500 px-4 py-2 text-white"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}