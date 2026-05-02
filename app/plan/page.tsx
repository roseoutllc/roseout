"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RoseOutHeader from "@/components/RoseOutHeader";

type Step = "plan" | "confirm" | "book";

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
    ...(restaurant?.review_keywords || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("brunch")) return "Brunch Spot";
  if (text.includes("breakfast")) return "Breakfast Spot";
  if (text.includes("lunch")) return "Lunch Spot";
  if (text.includes("late night")) return "Late Night Spot";
  if (text.includes("date") || text.includes("romantic")) return "Date Spot";
  if (text.includes("upscale") || text.includes("classy")) {
    return "Upscale Restaurant";
  }

  return "Restaurant";
}

export default function PlanPage() {
  const router = useRouter();

  const [plan, setPlan] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState<Step>("plan");

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

  const restaurantLabel = getRestaurantLabel(restaurant);

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

  const startNewSearch = () => {
    localStorage.removeItem("roseout_plan");
    sessionStorage.removeItem("roseout_create_state");
    router.push("/create");
  };

  const backToResults = () => {
    router.push("/create");
  };

  const goBackStep = () => {
    if (step === "book") return setStep("confirm");
    if (step === "confirm") return setStep("plan");
    return backToResults();
  };

  if (!loaded) {
    return (
      <>
        <RoseOutHeader />
        <main className="flex min-h-screen items-center justify-center bg-black pt-20 text-white">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-400">
            Loading your plan...
          </p>
        </main>
      </>
    );
  }

  if (!plan) {
    return (
      <>
        <RoseOutHeader />
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 pt-20 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(225,6,42,0.28),transparent_32%),#000]" />

          <div className="relative z-10 max-w-md rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">
              RoseOut Plan
            </p>

            <h1 className="mt-4 text-4xl font-black">No plan found</h1>

            <p className="mt-3 text-sm leading-7 text-white/60">
              Choose a restaurant or activity from your RoseOut results to build
              a plan.
            </p>

            <button
              onClick={startNewSearch}
              className="mt-6 rounded-full bg-red-600 px-7 py-3 text-sm font-black text-white transition hover:bg-red-500"
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
        <section className="relative border-b border-white/10 px-5 py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(225,6,42,0.32),transparent_32%),linear-gradient(180deg,#050505,#000)]" />

          <div className="relative mx-auto max-w-6xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={goBackStep}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white hover:text-black"
              >
                ← Back
              </button>

              <button
                onClick={startNewSearch}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-red-500"
              >
                Start New Search
              </button>
            </div>

            <Breadcrumb step={step} setStep={setStep} />

            <p className="mt-8 text-xs font-black uppercase tracking-[0.35em] text-red-400">
              RoseOut Plan Flow
            </p>

            <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
              {step === "plan" && (
                <>
                  Your night is
                  <br />
                  <span className="text-red-500">ready.</span>
                </>
              )}

              {step === "confirm" && (
                <>
                  Confirm your
                  <br />
                  <span className="text-red-500">outing.</span>
                </>
              )}

              {step === "book" && (
                <>
                  Time to
                  <br />
                  <span className="text-red-500">book.</span>
                </>
              )}
            </h1>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
                Selected Plan
              </p>

              <h2 className="mt-2 break-words text-2xl font-black sm:text-3xl">
                {planTitle}
              </h2>
            </div>
          </div>
        </section>

        <section className="relative px-5 py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(225,6,42,0.16),transparent_30%)]" />

          <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {step === "plan" && (
                <>
                  {restaurant && (
                    <PlanCard
                      eyebrow={restaurantLabel}
                      title={restaurant.restaurant_name}
                      imageUrl={restaurant.image_url}
                      address={restaurantAddress}
                      rating={restaurant.rating}
                      reviewCount={restaurant.review_count}
                      primaryTag={restaurant.primary_tag}
                      tags={restaurant.date_style_tags}
                      reservationUrl={
                        restaurant.reservation_url ||
                        restaurant.reservation_link
                      }
                      reservationLabel="Reserve"
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
                      reservationLabel="Book"
                      websiteUrl={activity.website}
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

            <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
              <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
                  Next Step
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  {step === "plan" && "Review your plan"}
                  {step === "confirm" && "Confirm details"}
                  {step === "book" && "Book your outing"}
                </h2>

                <p className="mt-3 text-sm leading-7 text-white/60">
                  {step === "plan" &&
                    "Review your selected restaurant and activity before confirming."}
                  {step === "confirm" &&
                    "Make sure this is the outing you want before booking."}
                  {step === "book" &&
                    "Use the booking, website, and directions links to finish your plan."}
                </p>

                <div className="mt-6 grid gap-3">
                  {step === "plan" && (
                    <button
                      onClick={() => setStep("confirm")}
                      className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500"
                    >
                      Continue to Confirm
                    </button>
                  )}

                  {step === "confirm" && (
                    <button
                      onClick={() => setStep("book")}
                      className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500"
                    >
                      Continue to Book
                    </button>
                  )}

                  {step === "book" && (
                    <>
                      {restaurant?.reservation_url ||
                      restaurant?.reservation_link ? (
                        <a
                          href={
                            restaurant.reservation_url ||
                            restaurant.reservation_link
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-red-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-red-500"
                        >
                          Reserve {restaurantLabel}
                        </a>
                      ) : null}

                      {activity?.reservation_url || activity?.reservation_link ? (
                        <a
                          href={
                            activity.reservation_url ||
                            activity.reservation_link
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-red-500/40 bg-red-500/10 px-5 py-3 text-center text-sm font-black text-red-100 transition hover:bg-red-600 hover:text-white"
                        >
                          Book Activity
                        </a>
                      ) : null}
                    </>
                  )}

                  <button
                    onClick={backToResults}
                    className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-black"
                  >
                    Back to Results
                  </button>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
                  Flow
                </p>

                <div className="mt-5 space-y-4">
                  <TimelineItem active={step === "plan"} number="1" title="Plan" />
                  <TimelineItem
                    active={step === "confirm"}
                    number="2"
                    title="Confirm"
                  />
                  <TimelineItem active={step === "book"} number="3" title="Book" />
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

function Breadcrumb({
  step,
  setStep,
}: {
  step: Step;
  setStep: (step: Step) => void;
}) {
  const steps: Step[] = ["plan", "confirm", "book"];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => (window.location.href = "/create")}
        className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/50 transition hover:bg-white hover:text-black"
      >
        Results
      </button>

      {steps.map((item, index) => {
        const active = step === item;

        return (
          <div key={item} className="flex items-center gap-2">
            <span className="text-white/20">/</span>

            <button
              onClick={() => setStep(item)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${
                active
                  ? "bg-red-600 text-white"
                  : "border border-white/10 bg-white/[0.05] text-white/50 hover:bg-white hover:text-black"
              }`}
            >
              {index + 1}. {item}
            </button>
          </div>
        );
      })}
    </div>
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
}: any) {
  return (
    <article className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#0d0d0d] shadow-2xl shadow-black/40">
      <div className="relative h-72 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
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
          <div className="absolute bottom-4 right-4 rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white">
            {flowers(rating)} {rating}
          </div>
        )}
      </div>

      <div className="p-6">
        <h2 className="break-words text-3xl font-black">{title}</h2>

        {address && <p className="mt-3 text-sm leading-6 text-white/55">{address}</p>}

        {reviewCount ? (
          <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">
            {reviewCount} review{reviewCount === 1 ? "" : "s"}
          </p>
        ) : null}

        {primaryTag && (
          <p className="mt-4 text-sm font-black text-red-100">✨ {primaryTag}</p>
        )}

        {tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.slice(0, 4).map((tag: string) => (
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

function ConfirmStep({
  restaurant,
  activity,
  restaurantLabel,
}: {
  restaurant: any;
  activity: any;
  restaurantLabel: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
        Confirm
      </p>

      <h2 className="mt-3 text-3xl font-black">Confirm your selected outing.</h2>

      <div className="mt-6 grid gap-4">
        {restaurant && (
          <ConfirmRow label={restaurantLabel} value={restaurant.restaurant_name} />
        )}

        {activity && (
          <ConfirmRow label="Activity" value={activity.activity_name} />
        )}
      </div>
    </section>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

function BookStep({
  restaurant,
  activity,
  restaurantLabel,
  restaurantMapsUrl,
  activityMapsUrl,
}: {
  restaurant: any;
  activity: any;
  restaurantLabel: string;
  restaurantMapsUrl: string;
  activityMapsUrl: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
        Book
      </p>

      <h2 className="mt-3 text-3xl font-black">Finish booking your outing.</h2>

      <div className="mt-6 grid gap-4">
        {restaurant && (
          <BookBox
            title={restaurant.restaurant_name}
            reservationUrl={restaurant.reservation_url || restaurant.reservation_link}
            websiteUrl={restaurant.website}
            mapsUrl={restaurantMapsUrl}
            reserveLabel={`Reserve ${restaurantLabel}`}
          />
        )}

        {activity && (
          <BookBox
            title={activity.activity_name}
            reservationUrl={activity.reservation_url || activity.reservation_link}
            websiteUrl={activity.website}
            mapsUrl={activityMapsUrl}
            reserveLabel="Book Activity"
          />
        )}
      </div>
    </section>
  );
}

function BookBox({ title, reservationUrl, websiteUrl, mapsUrl, reserveLabel }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="text-xl font-black">{title}</h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {reservationUrl && (
          <a
            href={reservationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-red-600 px-4 py-3 text-center text-sm font-black text-white"
          >
            {reserveLabel}
          </a>
        )}

        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 px-4 py-3 text-center text-sm font-black text-white"
          >
            Website
          </a>
        )}

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/15 px-4 py-3 text-center text-sm font-black text-white"
        >
          Directions
        </a>
      </div>
    </div>
  );
}

function TimelineItem({
  number,
  title,
  active,
}: {
  number: string;
  title: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
          active ? "bg-red-600 text-white" : "bg-white/10 text-white/45"
        }`}
      >
        {number}
      </div>

      <div>
        <p className={`text-sm font-black ${active ? "text-white" : "text-white/45"}`}>
          {title}
        </p>
        <p className="text-xs font-bold text-white/35">
          RoseOut planning step
        </p>
      </div>
    </div>
  );
}