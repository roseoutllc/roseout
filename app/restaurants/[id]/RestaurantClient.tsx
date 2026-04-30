"use client";

import { useEffect } from "react";

export default function RestaurantClient({ restaurant }: any) {
  // ✅ TRACK VIEW
  useEffect(() => {
    fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: restaurant.id,
        type: "restaurant",
        event: "view",
      }),
    });
  }, [restaurant.id]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-extrabold">
        {restaurant.restaurant_name}
      </h1>

      <p className="mt-2 text-neutral-400">
        {restaurant.city}
      </p>

      <img
        src={restaurant.image_url}
        className="mt-6 w-full rounded-2xl"
      />

      <p className="mt-6 text-lg">{restaurant.description}</p>

      <div className="mt-6">
        <a
          href={restaurant.reservation_link}
          target="_blank"
          onClick={() => {
            // ✅ TRACK CLICK
            fetch("/api/analytics", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: restaurant.id,
                type: "restaurant",
                event: "click",
              }),
            });
          }}
          className="inline-block rounded-full bg-yellow-500 px-6 py-3 font-bold text-black"
        >
          Reserve
        </a>
      </div>
    </div>
  );
}