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
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="text-center">
          <p className="text-2xl font-bold">No plan found</p>
          <a
            href="/create"
            className="mt-4 inline-block rounded-full bg-yellow-500 px-6 py-3 font-bold text-black"
          >
            Create a Plan
          </a>
        </div>
      </main>
    );
  }

  const { restaurant, activity } = plan;

  const planTitle =
    restaurant && activity
      ? `${restaurant.restaurant_name} + ${activity.activity_name}`
      : restaurant
      ? restaurant.restaurant_name
      : activity?.activity_name || "Your Plan";

  const planSubtitle =
    restaurant?.primary_tag ||
    activity?.primary_tag ||
    "Curated by RoseOut";

  const restaurantMapsUrl = restaurant
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${restaurant.restaurant_name} ${restaurant.address} ${restaurant.city}`
      )}`
    : "#";

  const activityMapsUrl = activity
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${activity.activity_name} ${activity.address} ${activity.city}`
      )}`
    : "#";

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => window.history.back()}
          className="mb-6 text-sm font-semibold text-yellow-500"
        >
          ← Back to results
        </button>

        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-yellow-500">
            RoseOut
          </p>

          <h1 className="text-4xl font-bold tracking-tight">Your Plan</h1>

          <p className="mt-3 text-neutral-400">
            A curated outing built from your selected matches.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white p-5 text-black shadow-2xl">
          <div className="mb-6 rounded-[1.5rem] bg-black p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-500">
              Plan Overview
            </p>

            <h2 className="mt-2 text-2xl font-extrabold">
              {planTitle}
            </h2>

            <p className="mt-2 text-sm text-neutral-300">
              {planSubtitle}
            </p>
          </div>

          {restaurant && (
            <section className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-lg">
              {restaurant.image_url ? (
                <img
                  src={restaurant.image_url}
                  alt={restaurant.restaurant_name}
                  className="h-60 w-full object-cover"
                />
              ) : (
                <div className="flex h-60 items-center justify-center bg-neutral-200 text-neutral-500">
                  No image available
                </div>
              )}

              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-600">
                  Dinner
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  {restaurant.restaurant_name}
                </h2>

                <p className="mt-2 text-sm text-neutral-600">
                  {restaurant.address}, {restaurant.city}, {restaurant.state}{" "}
                  {restaurant.zip_code}
                </p>

                {restaurant.rating && (
                  <p className="mt-2 text-sm font-semibold text-neutral-700">
                    ⭐ {restaurant.rating}
                    {restaurant.review_count
                      ? ` (${restaurant.review_count} reviews)`
                      : ""}
                  </p>
                )}

                {restaurant.primary_tag && (
                  <p className="mt-3 text-sm font-bold">
                    ✨ {restaurant.primary_tag}
                  </p>
                )}

                {restaurant.date_style_tags?.length ? (
                  <p className="mt-1 text-sm text-neutral-500">
                    {restaurant.date_style_tags.slice(0, 3).join(" · ")}
                  </p>
                ) : null}

                <div className="mt-5 grid gap-3">
                  {restaurant.reservation_link && (
                    <a
                      href={restaurant.reservation_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-black px-5 py-3 text-center text-sm font-bold text-white"
                    >
                      Reserve Dinner
                    </a>
                  )}

                  <a
                    href={restaurantMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-black px-5 py-3 text-center text-sm font-bold text-black"
                  >
                    Get Dinner Directions
                  </a>
                </div>
              </div>
            </section>
          )}

          {activity && (
            <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-lg">
              {activity.image_url ? (
                <img
                  src={activity.image_url}
                  alt={activity.activity_name}
                  className="h-60 w-full object-cover"
                />
              ) : (
                <div className="flex h-60 items-center justify-center bg-neutral-200 text-neutral-500">
                  No image available
                </div>
              )}

              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-600">
                  {activity.activity_type || "Activity"}
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  {activity.activity_name}
                </h2>

                <p className="mt-2 text-sm text-neutral-600">
                  {activity.address}, {activity.city}, {activity.state}{" "}
                  {activity.zip_code}
                </p>

                {activity.rating && (
                  <p className="mt-2 text-sm font-semibold text-neutral-700">
                    ⭐ {activity.rating}
                    {activity.review_count
                      ? ` (${activity.review_count} reviews)`
                      : ""}
                  </p>
                )}

                {activity.primary_tag && (
                  <p className="mt-3 text-sm font-bold">
                    ✨ {activity.primary_tag}
                  </p>
                )}

                {activity.date_style_tags?.length ? (
                  <p className="mt-1 text-sm text-neutral-500">
                    {activity.date_style_tags.slice(0, 3).join(" · ")}
                  </p>
                ) : null}

                <div className="mt-5 grid gap-3">
                  {activity.reservation_link && (
                    <a
                      href={activity.reservation_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-black px-5 py-3 text-center text-sm font-bold text-white"
                    >
                      Book Activity
                    </a>
                  )}

                  {activity.website && (
                    <a
                      href={activity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-black px-5 py-3 text-center text-sm font-bold text-black"
                    >
                      View Activity Website
                    </a>
                  )}

                  <a
                    href={activityMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-black px-5 py-3 text-center text-sm font-bold text-black"
                  >
                    Get Activity Directions
                  </a>
                </div>
              </div>
            </section>
          )}

          <div className="mt-6 grid gap-3">
            <button
              onClick={() => window.history.back()}
              className="rounded-full border border-black px-5 py-3 text-sm font-bold text-black"
            >
              Back to Results
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("roseout_plan");
                window.location.href = "/create";
              }}
              className="rounded-full bg-yellow-500 px-5 py-3 text-sm font-extrabold text-black"
            >
              Start New Plan
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}