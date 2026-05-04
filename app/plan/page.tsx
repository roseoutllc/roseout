"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RoseOutHeader from "@/components/RoseOutHeader";

type Step = "plan" | "confirm" | "book";

/* ---------------- HELPERS ---------------- */

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

function getRestaurantLabel(restaurant: any) {
  const text = [
    restaurant?.primary_tag,
    restaurant?.cuisine,
    restaurant?.atmosphere,
    ...(restaurant?.date_style_tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("brunch")) return "Brunch Spot";
  if (text.includes("romantic")) return "Date Spot";
  if (text.includes("upscale")) return "Upscale Restaurant";

  return "Restaurant";
}

/* ---------------- PAGE ---------------- */

export default function PlanPage() {
  const router = useRouter();

  const [plan, setPlan] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState<Step>("plan");

  useEffect(() => {
    const saved = localStorage.getItem("roseout_plan");
    if (saved) setPlan(JSON.parse(saved));
    setLoaded(true);
  }, []);

  const restaurant = plan?.restaurant;
  const activity = plan?.activity;

  const restaurantLabel = getRestaurantLabel(restaurant);

  const restaurantAddress = buildAddress(restaurant);
  const activityAddress = buildAddress(activity);

  const restaurantMapsUrl = useMemo(
    () => buildMapsUrl(restaurant?.restaurant_name || "", restaurantAddress),
    [restaurant, restaurantAddress]
  );

  const activityMapsUrl = useMemo(
    () => buildMapsUrl(activity?.activity_name || "", activityAddress),
    [activity, activityAddress]
  );

  const startNewSearch = () => {
    localStorage.removeItem("roseout_plan");
    router.push("/create");
  };

  if (!loaded) return null;

  return (
    <>
      <RoseOutHeader />

      {/* 🔥 FIXED MOBILE ROOT */}
      <main className="min-h-screen w-full overflow-x-hidden bg-black pt-20 text-white px-4">

        {/* HEADER */}
        <section className="py-6">
          <div className="mx-auto max-w-6xl">

            {/* 🔥 FIXED BUTTON WRAP */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                onClick={() => router.push("/create")}
                className="w-full sm:w-auto rounded-full border border-white/20 px-4 py-2 text-sm font-bold"
              >
                ← Back
              </button>

              <button
                onClick={startNewSearch}
                className="w-full sm:w-auto rounded-full bg-red-600 px-4 py-2 text-sm font-bold"
              >
                New Search
              </button>
            </div>

            {/* 🔥 FIXED TEXT SIZE */}
            <h1 className="mt-6 text-3xl sm:text-6xl font-black leading-tight">
              Your Plan
            </h1>

            <p className="text-white/50 mt-2 text-sm">
              Review → Confirm → Book
            </p>
          </div>
        </section>

        {/* MAIN GRID */}
        <section className="py-6">
          <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-[1fr_320px]">

            {/* LEFT SIDE */}
            <div className="space-y-6">

              {step === "plan" && (
                <>
                  {restaurant && (
                    <PlanCard
                      title={restaurant.restaurant_name}
                      imageUrl={restaurant.image_url}
                      address={restaurantAddress}
                      rating={restaurant.rating}
                      reservationUrl={restaurant.reservation_url}
                      mapsUrl={restaurantMapsUrl}
                    />
                  )}

                  {activity && (
                    <PlanCard
                      title={activity.activity_name}
                      imageUrl={activity.image_url}
                      address={activityAddress}
                      rating={activity.rating}
                      reservationUrl={activity.reservation_url}
                      mapsUrl={activityMapsUrl}
                    />
                  )}
                </>
              )}

              {step === "confirm" && (
                <ConfirmStep
                  restaurant={restaurant}
                  activity={activity}
                  restaurantLabel={restaurantLabel}
                />
              )}

              {step === "book" && (
                <BookStep
                  restaurant={restaurant}
                  activity={activity}
                  restaurantLabel={restaurantLabel}
                  restaurantMapsUrl={restaurantMapsUrl}
                  activityMapsUrl={activityMapsUrl}
                />
              )}

            </div>

            {/* RIGHT SIDE */}
            <aside className="space-y-6">

              {/* 🔥 FIXED MOBILE PANEL */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">

                <h2 className="text-xl font-bold">
                  {step === "plan" && "Review"}
                  {step === "confirm" && "Confirm"}
                  {step === "book" && "Book"}
                </h2>

                <div className="mt-4 flex flex-col gap-3">

                  {step === "plan" && (
                    <button
                      onClick={() => setStep("confirm")}
                      className="w-full bg-red-600 py-3 rounded-full font-bold"
                    >
                      Continue
                    </button>
                  )}

                  {step === "confirm" && (
                    <button
                      onClick={() => setStep("book")}
                      className="w-full bg-red-600 py-3 rounded-full font-bold"
                    >
                      Continue
                    </button>
                  )}

                  {step === "book" && (
                    <>
                      {restaurant?.reservation_url && (
                        <a
                          href={restaurant.reservation_url}
                          target="_blank"
                          className="w-full text-center bg-red-600 py-3 rounded-full font-bold"
                        >
                          Reserve {restaurantLabel}
                        </a>
                      )}

                      {activity?.reservation_url && (
                        <a
                          href={activity.reservation_url}
                          target="_blank"
                          className="w-full text-center border border-white/20 py-3 rounded-full font-bold"
                        >
                          Book Activity
                        </a>
                      )}
                    </>
                  )}

                </div>
              </div>

            </aside>

          </div>
        </section>
      </main>
    </>
  );
}

/* ---------------- CARD ---------------- */

function PlanCard({
  title,
  imageUrl,
  address,
  rating,
  reservationUrl,
  mapsUrl,
}: any) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d]">

      {/* 🔥 FIXED IMAGE */}
      <div className="relative w-full h-[220px] sm:h-[260px]">
        {imageUrl ? (
          <img className="w-full h-full object-cover" src={imageUrl} />
        ) : (
          <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white/40">
            No Image
          </div>
        )}

        {/* 🔥 SMALL SCORE */}
        {rating && (
          <div className="absolute bottom-3 right-3 bg-red-600 px-3 py-1 rounded-full text-xs font-bold">
            {flowers(rating)} {rating}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">

        <h2 className="text-xl sm:text-2xl font-bold leading-tight">
          {title}
        </h2>

        <p className="text-sm text-white/60">{address}</p>

        {/* 🔥 STACKED BUTTONS */}
        <div className="flex flex-col gap-2 sm:flex-row">

          {reservationUrl && (
            <a
              href={reservationUrl}
              target="_blank"
              className="w-full text-center bg-red-600 py-2 rounded-full text-sm font-bold"
            >
              Reserve
            </a>
          )}

          <a
            href={mapsUrl}
            target="_blank"
            className="w-full text-center border border-white/20 py-2 rounded-full text-sm font-bold"
          >
            Directions
          </a>

        </div>
      </div>
    </div>
  );
}

/* ---------------- CONFIRM ---------------- */

function ConfirmStep({ restaurant, activity, restaurantLabel }: any) {
  return (
    <div className="rounded-2xl border border-white/10 p-5">
      <h2 className="text-xl font-bold mb-4">Confirm</h2>

      {restaurant && <p>{restaurant.restaurant_name}</p>}
      {activity && <p>{activity.activity_name}</p>}
    </div>
  );
}

/* ---------------- BOOK ---------------- */

function BookStep({
  restaurant,
  activity,
  restaurantLabel,
  restaurantMapsUrl,
  activityMapsUrl,
}: any) {
  return (
    <div className="rounded-2xl border border-white/10 p-5">
      <h2 className="text-xl font-bold mb-4">Book</h2>

      {restaurant && (
        <a href={restaurantMapsUrl} target="_blank">
          Directions to {restaurant.restaurant_name}
        </a>
      )}

      {activity && (
        <a href={activityMapsUrl} target="_blank">
          Directions to {activity.activity_name}
        </a>
      )}
    </div>
  );
}