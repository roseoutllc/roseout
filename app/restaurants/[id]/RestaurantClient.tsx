"use client";

import { useEffect } from "react";
import { trackAnalytics } from "@/lib/trackAnalytics";

export default function RestaurantClient({ restaurant }: any) {
  useEffect(() => {
    if (!restaurant?.id) return;

    trackAnalytics({
      itemId: restaurant.id,
      itemType: "restaurant",
      eventType: "view",
    });
  }, [restaurant?.id]);

  const trackClick = () => {
    if (!restaurant?.id) return;

    trackAnalytics({
      itemId: restaurant.id,
      itemType: "restaurant",
      eventType: "click",
    });
  };

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <a
          href="/create"
          className="mb-6 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
        >
          ← Back to results
        </a>

        <div className="overflow-hidden rounded-[2rem] bg-white text-black shadow-2xl">
          {restaurant.image_url ? (
            <img
              src={restaurant.image_url}
              alt={restaurant.restaurant_name}
              className="h-80 w-full object-cover"
            />
          ) : (
            <div className="flex h-80 items-center justify-center bg-neutral-200 text-neutral-500">
              No image available
            </div>
          )}

          <div className="p-6">
            {restaurant.roseout_score >= 80 && (
              <div className="mb-4 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-700">
                Top 10% Match
              </div>
            )}

            <h1 className="text-4xl font-extrabold">
              {restaurant.restaurant_name}
            </h1>

            <p className="mt-3 text-neutral-600">
              {restaurant.address}, {restaurant.city}, {restaurant.state}{" "}
              {restaurant.zip_code}
            </p>

            {restaurant.rating && (
              <p className="mt-3 text-sm font-bold text-neutral-700">
                ⭐ {restaurant.rating}
                {restaurant.review_count
                  ? ` (${restaurant.review_count} reviews)`
                  : ""}
              </p>
            )}

            {restaurant.primary_tag && (
              <p className="mt-4 text-lg font-bold">
                ✨ {restaurant.primary_tag}
              </p>
            )}

            {restaurant.date_style_tags?.length ? (
              <p className="mt-2 text-sm text-neutral-500">
                {restaurant.date_style_tags.slice(0, 5).join(" · ")}
              </p>
            ) : null}

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  RoseOut Match
                </span>

                <span className="text-xs font-bold text-black">
                  {restaurant.roseout_score || 0}/100
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-yellow-500"
                  style={{
                    width: `${Math.min(restaurant.roseout_score || 0, 100)}%`,
                  }}
                />
              </div>
            </div>

            {restaurant.description && (
              <p className="mt-6 leading-7 text-neutral-700">
                {restaurant.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {restaurant.reservation_link && (
                <a
                  href={restaurant.reservation_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackClick}
                  className="rounded-full bg-yellow-500 px-6 py-3 font-extrabold text-black"
                >
                  Reserve
                </a>
              )}

              {restaurant.website && (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackClick}
                  className="rounded-full bg-black px-6 py-3 font-extrabold text-white"
                >
                  Visit Website
                </a>
              )}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-neutral-100 p-4">
                <p className="text-xs font-bold uppercase text-neutral-500">
                  Views
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {restaurant.view_count || 0}
                </p>
              </div>

              <div className="rounded-2xl bg-neutral-100 p-4">
                <p className="text-xs font-bold uppercase text-neutral-500">
                  Clicks
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {restaurant.click_count || 0}
                </p>
              </div>

              <div className="rounded-2xl bg-neutral-100 p-4">
                <p className="text-xs font-bold uppercase text-neutral-500">
                  City
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {restaurant.city || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}