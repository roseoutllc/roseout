"use client";

import { useEffect } from "react";
import { trackAnalytics } from "@/lib/trackAnalytics";
import BackButton from "@/components/BackButton";

export default function ActivityClient({ activity }: any) {
  useEffect(() => {
    if (!activity?.id) return;

    trackAnalytics({
      itemId: activity.id,
      itemType: "activity",
      eventType: "view",
    });
  }, [activity?.id]);

  const trackClick = () => {
    if (!activity?.id) return;

    trackAnalytics({
      itemId: activity.id,
      itemType: "activity",
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
          {activity.image_url ? (
            <img
              src={activity.image_url}
              alt={activity.activity_name}
              className="h-80 w-full object-cover"
            />
          ) : (
            <div className="flex h-80 items-center justify-center bg-neutral-200 text-neutral-500">
              No image available
            </div>
          )}

          <div className="p-6">
            {activity.roseout_score >= 80 && (
              <div className="mb-4 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-700">
                Top 10% Match
              </div>
            )}

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-yellow-600">
              {activity.activity_type || "Activity"}
            </p>

            <h1 className="text-4xl font-extrabold">
              {activity.activity_name}
            </h1>

            <p className="mt-3 text-neutral-600">
              {activity.address}, {activity.city}, {activity.state}{" "}
              {activity.zip_code}
            </p>

            {activity.rating && (
              <p className="mt-3 text-sm font-bold text-neutral-700">
                ⭐ {activity.rating}
                {activity.review_count
                  ? ` (${activity.review_count} reviews)`
                  : ""}
              </p>
            )}

            {activity.primary_tag && (
              <p className="mt-4 text-lg font-bold">
                ✨ {activity.primary_tag}
              </p>
            )}

            {activity.date_style_tags?.length ? (
              <p className="mt-2 text-sm text-neutral-500">
                {activity.date_style_tags.slice(0, 5).join(" · ")}
              </p>
            ) : null}

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  RoseOut Match
                </span>

                <span className="text-xs font-bold text-black">
                  {activity.roseout_score || 0}/100
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-yellow-500"
                  style={{
                    width: `${Math.min(activity.roseout_score || 0, 100)}%`,
                  }}
                />
              </div>
            </div>

            {activity.description && (
              <p className="mt-6 leading-7 text-neutral-700">
                {activity.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {activity.reservation_link && (
                <a
                  href={activity.reservation_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackClick}
                  className="rounded-full bg-yellow-500 px-6 py-3 font-extrabold text-black"
                >
                  Book
                </a>
              )}

              {activity.website && (
                <a
                  href={activity.website}
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
                  {activity.view_count || 0}
                </p>
              </div>

              <div className="rounded-2xl bg-neutral-100 p-4">
                <p className="text-xs font-bold uppercase text-neutral-500">
                  Clicks
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {activity.click_count || 0}
                </p>
              </div>

              <div className="rounded-2xl bg-neutral-100 p-4">
                <p className="text-xs font-bold uppercase text-neutral-500">
                  City
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {activity.city || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}