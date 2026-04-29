"use client";

import { useEffect, useState } from "react";

export default function PlanPage() {
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("roseout_plan");
    if (saved) {
      setPlan(JSON.parse(saved));
    }
  }, []);

  if (!plan) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>No plan found.</p>
      </main>
    );
  }

  const { restaurant, activity } = plan;

  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Your Plan</h1>

        {/* RESTAURANT */}
        {restaurant && (
          <div className="mb-8 rounded-2xl bg-white text-black overflow-hidden">
            {restaurant.image_url && (
              <img
                src={restaurant.image_url}
                alt={restaurant.restaurant_name}
                className="h-56 w-full object-cover"
              />
            )}

            <div className="p-5">
              <p className="text-xs uppercase text-neutral-500 mb-2">
                Dinner
              </p>

              <h2 className="text-2xl font-bold">
                {restaurant.restaurant_name}
              </h2>

              <p className="mt-2 text-sm text-neutral-600">
                {restaurant.address}, {restaurant.city}
              </p>

              {restaurant.rating && (
                <p className="mt-2 text-sm font-semibold">
                  ⭐ {restaurant.rating}
                </p>
              )}

              <div className="mt-4 flex gap-3">
                {restaurant.reservation_link && (
                  <a
                    href={restaurant.reservation_link}
                    target="_blank"
                    className="rounded-full bg-black px-4 py-2 text-white text-sm font-bold"
                  >
                    Reserve
                  </a>
                )}

                {restaurant.website && (
                  <a
                    href={restaurant.website}
                    target="_blank"
                    className="rounded-full border px-4 py-2 text-sm font-bold"
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITY */}
        {activity && (
          <div className="rounded-2xl bg-white text-black overflow-hidden">
            {activity.image_url && (
              <img
                src={activity.image_url}
                alt={activity.activity_name}
                className="h-56 w-full object-cover"
              />
            )}

            <div className="p-5">
              <p className="text-xs uppercase text-neutral-500 mb-2">
                Activity
              </p>

              <h2 className="text-2xl font-bold">
                {activity.activity_name}
              </h2>

              <p className="mt-2 text-sm text-neutral-600">
                {activity.address}, {activity.city}
              </p>

              {activity.rating && (
                <p className="mt-2 text-sm font-semibold">
                  ⭐ {activity.rating}
                </p>
              )}

              <div className="mt-4 flex gap-3">
                {activity.website && (
                  <a
                    href={activity.website}
                    target="_blank"
                    className="rounded-full bg-black px-4 py-2 text-white text-sm font-bold"
                  >
                    View
                  </a>
                )}

                {activity.reservation_link && (
                  <a
                    href={activity.reservation_link}
                    target="_blank"
                    className="rounded-full border px-4 py-2 text-sm font-bold"
                  >
                    Book
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="mt-10 flex gap-3">
          <button
            onClick={() => window.history.back()}
            className="w-full rounded-full border px-4 py-3 text-sm font-bold"
          >
            Back
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("roseout_plan");
              window.location.href = "/";
            }}
            className="w-full rounded-full bg-yellow-500 px-4 py-3 text-black font-bold"
          >
            Start Over
          </button>
        </div>
      </div>
    </main>
  );
}