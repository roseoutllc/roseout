"use client";

import { useEffect, useMemo, useState } from "react";
import RoseOutHeader from "@/components/RoseOutHeader";

function buildAddress(item: any) {
  return [item?.address, item?.city, item?.state, item?.zip_code]
    .filter(Boolean)
    .join(", ");
}

function buildMapsUrl(name: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} ${address}`
  )}`;
}

function flowers(rating?: number | null) {
  const count = Math.max(1, Math.min(5, Math.round(Number(rating || 5))));
  return "🌸".repeat(count);
}

export default function PlanPage() {
  const [plan, setPlan] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("roseout_plan");

    if (saved) {
      try {
        setPlan(JSON.parse(saved));
      } catch {
        setPlan(null);
      }
    }

    setLoaded(true);
  }, []);

  const restaurant = plan?.restaurant;
  const activity = plan?.activity;

  const restaurantName = restaurant?.restaurant_name || "";
  const activityName = activity?.activity_name || "";

  const restaurantAddress = buildAddress(restaurant);
  const activityAddress = buildAddress(activity);

  const restaurantMapsUrl = useMemo(
    () => buildMapsUrl(restaurantName, restaurantAddress),
    [restaurantName, restaurantAddress]
  );

  const activityMapsUrl = useMemo(
    () => buildMapsUrl(activityName, activityAddress),
    [activityName, activityAddress]
  );

  const planTitle =
    restaurant && activity
      ? `${restaurantName} + ${activityName}`
      : restaurant
        ? restaurantName
        : activityName || "Your RoseOut Plan";

  const planSubtitle =
    restaurant?.primary_tag ||
    activity?.primary_tag ||
    "A curated outing built from your selected matches.";

  const startNewSearch = () => {
    localStorage.removeItem("roseout_plan");
    sessionStorage.removeItem("roseout_create_state");
    window.location.href = "/create";
  };

  const backToResults = () => {
    window.location.href = "/create";
  };

  if (!loaded) {
    return (
      <>
        <RoseOutHeader />
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 pt-20 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(225,6,42,0.28),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(127,29,29,0.3),transparent_28%),#000]" />

          <div className="relative z-10 rounded-[2rem] border border-white/10 bg-white/[0.05] px-8 py-6 text-center shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">
              RoseOut
            </p>
            <p className="mt-3 text-sm font-bold text-white/70">
              Loading your plan...
            </p>
          </div>
        </main>
      </>
    );
  }

  if (!plan) {
    return (
      <>
        <RoseOutHeader />
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 pt-20 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(225,6,42,0.28),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(127,29,29,0.3),transparent_28%),#000]" />

          <div className="relative z-10 max-w-md rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">
              RoseOut Plan
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight">
              No plan found
            </h1>

            <p className="mt-3 text-sm leading-7 text-white/60">
              Choose a restaurant or activity from your RoseOut results to build
              a plan.
            </p>

            <button
              onClick={startNewSearch}
              className="mt-6 rounded-full bg-red-600 px-7 py-3 text-sm font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500"
            >
              Create a Plan
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <RoseOutHeader />

      <main className="min-h-screen overflow-hidden bg-black pt-20 text-white">
        <section className="relative overflow-hidden border-b border-white/10 px-5 py-10 sm:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(225,6,42,0.32),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(127,29,29,0.35),transparent_28%),linear-gradient(180deg,#050505,#000)]" />

          <div className="relative mx-auto max-w-6xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={backToResults}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
              >
                ← Back to Results
              </button>

              <button
                type="button"
                onClick={startNewSearch}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500"
              >
                Start New Search
              </button>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">
              RoseOut Itinerary
            </p>

            <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
              Your night is
              <br />
              <span className="text-red-500">ready.</span>
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-8 text-white/65 md:text-lg">
              {planSubtitle}
            </p>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
                Selected Plan
              </p>

              <h2 className="mt-2 break-words text-2xl font-black tracking-tight text-white sm:text-3xl">
                {planTitle}
              </h2>
            </div>
          </div>
        </section>

        <section className="relative px-5 py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(225,6,42,0.16),transparent_30%)]" />

          <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {restaurant && (
                <PlanCard
                  eyebrow="Dinner"
                  title={restaurant.restaurant_name}
                  imageUrl={restaurant.image_url}
                  address={restaurantAddress}
                  rating={restaurant.rating}
                  reviewCount={restaurant.review_count}
                  primaryTag={restaurant.primary_tag}
                  tags={restaurant.date_style_tags}
                  reservationUrl={
                    restaurant.reservation_url || restaurant.reservation_link
                  }
                  reservationLabel="Reserve Dinner"
                  websiteUrl={restaurant.website}
                  mapsUrl={restaurantMapsUrl}
                />
              )}

              {activity && (
                <PlanCard
                  eyebrow={activity.activity_type || "Activity"}
                  title={activity.activity_name}
                  imageUrl={activity.image_url}
                  address={activityAddress}
                  rating={activity.rating}
                  reviewCount={activity.review_count}
                  primaryTag={activity.primary_tag}
                  tags={activity.date_style_tags}
                  reservationUrl={
                    activity.reservation_url || activity.reservation_link
                  }
                  reservationLabel="Book Activity"
                  websiteUrl={activity.website}
                  mapsUrl={activityMapsUrl}
                />
              )}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
              <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
                  Plan Actions
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  Ready to go?
                </h2>

                <p className="mt-3 text-sm leading-7 text-white/60">
                  Reserve, book, or get directions for each stop in your
                  RoseOut plan.
                </p>

                <div className="mt-6 grid gap-3">
                  {restaurant?.reservation_url || restaurant?.reservation_link ? (
                    <a
                      href={
                        restaurant.reservation_url || restaurant.reservation_link
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-red-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-red-500"
                    >
                      Reserve Dinner
                    </a>
                  ) : null}

                  {activity?.reservation_url || activity?.reservation_link ? (
                    <a
                      href={activity.reservation_url || activity.reservation_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-red-500/40 bg-red-500/10 px-5 py-3 text-center text-sm font-black text-red-100 transition hover:bg-red-600 hover:text-white"
                    >
                      Book Activity
                    </a>
                  ) : null}

                  <button
                    onClick={backToResults}
                    className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-black"
                  >
                    Back to Results
                  </button>

                  <button
                    onClick={startNewSearch}
                    className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white hover:text-black"
                  >
                    Start New Search
                  </button>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
                  RoseOut Flow
                </p>

                <div className="mt-5 space-y-4">
                  {restaurant && <TimelineItem number="1" title="Dinner" />}
                  {activity && (
                    <TimelineItem
                      number={restaurant ? "2" : "1"}
                      title={activity.activity_type || "Activity"}
                    />
                  )}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>

      <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-full border border-white/10 bg-black/85 p-2 shadow-2xl backdrop-blur-xl md:hidden">
        <button
          onClick={backToResults}
          className="block w-full rounded-full bg-red-600 px-6 py-4 text-center text-sm font-black text-white"
        >
          Back to Results
        </button>
      </div>
    </>
  );
}

function PlanCard({
  eyebrow,
  title,
  imageUrl,
  address,
  rating,
  reviewCount,
  primaryTag,
  tags,
  reservationUrl,
  reservationLabel,
  websiteUrl,
  mapsUrl,
}: {
  eyebrow: string;
  title: string;
  imageUrl?: string;
  address: string;
  rating?: number | null;
  reviewCount?: number | null;
  primaryTag?: string | null;
  tags?: string[];
  reservationUrl?: string;
  reservationLabel: string;
  websiteUrl?: string;
  mapsUrl: string;
}) {
  return (
    <article className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#0d0d0d] shadow-2xl shadow-black/40">
      <div className="relative h-72 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-neutral-500">
            No image available
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />

        <div className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-black">
          {eyebrow}
        </div>

        {rating && (
          <div className="absolute bottom-4 right-4 rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white shadow-lg">
            {flowers(rating)} {rating}
          </div>
        )}
      </div>

      <div className="p-6">
        <h2 className="break-words text-3xl font-black tracking-tight text-white">
          {title}
        </h2>

        {address && (
          <p className="mt-3 text-sm leading-6 text-white/55">{address}</p>
        )}

        {reviewCount ? (
          <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">
            {reviewCount} review{reviewCount === 1 ? "" : "s"}
          </p>
        ) : null}

        {primaryTag && (
          <p className="mt-4 text-sm font-black text-red-100">
            ✨ {primaryTag}
          </p>
        )}

        {tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-white/60"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {reservationUrl && (
            <a
              href={reservationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-red-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-red-500"
            >
              {reservationLabel}
            </a>
          )}

          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white hover:text-black"
            >
              Website
            </a>
          )}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white hover:text-black"
          >
            Directions
          </a>
        </div>
      </div>
    </article>
  );
}

function TimelineItem({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white">
        {number}
      </div>

      <div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="text-xs font-bold text-white/40">Selected RoseOut stop</p>
      </div>
    </div>
  );
}