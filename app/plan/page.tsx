"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

  const nextStep = () => {
    if (step === "plan") return setStep("confirm");
    if (step === "confirm") return setStep("book");
  };

  const nextButtonText =
    step === "plan"
      ? "Continue to Confirm"
      : step === "confirm"
        ? "Continue to Book"
        : "Finish Booking";

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 pt-24 text-white">
        <p className="text-center text-xs font-black uppercase tracking-[0.3em] text-red-400">
          Loading your plan...
        </p>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 pt-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(225,6,42,0.28),transparent_32%),#000]" />

        <div className="relative z-10 w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6 text-center shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-red-400">
            RoseOut Plan
          </p>

          <h1 className="mt-4 text-3xl font-black">No plan found</h1>

          <p className="mt-3 text-sm leading-7 text-white/60">
            Choose a restaurant or activity from your RoseOut results to build a
            plan.
          </p>

          <button
            onClick={startNewSearch}
            className="mt-6 w-full rounded-full bg-red-600 px-7 py-3 text-sm font-black text-white transition hover:bg-red-500"
          >
            Create a Plan
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-black pb-28 pt-20 text-white lg:pb-0">
      <section className="relative border-b border-white/10 px-4 pb-7 pt-6 sm:px-5 sm:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(225,6,42,0.3),transparent_32%),linear-gradient(180deg,#050505,#000)]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-5 flex items-center justify-between gap-2">
            <button
              onClick={goBackStep}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white hover:text-black"
            >
              ← Back
            </button>

            <button
              onClick={startNewSearch}
              className="rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white transition hover:bg-red-500"
            >
              New Search
            </button>
          </div>

          <Breadcrumb step={step} setStep={setStep} />

          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.28em] text-red-400 sm:text-xs">
            RoseOut Plan Flow
          </p>

          <h1 className="mt-4 text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
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

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
              Selected Plan
            </p>

            <h2 className="mt-2 break-words text-xl font-black leading-tight sm:text-3xl">
              {planTitle}
            </h2>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-7 sm:px-5 sm:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(225,6,42,0.16),transparent_30%)]" />

        <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
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
                      restaurant.reservation_url || restaurant.reservation_link
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

          <aside className="hidden space-y-6 lg:block lg:sticky lg:top-28 lg:self-start">
            <NextStepCard
              step={step}
              restaurant={restaurant}
              activity={activity}
              restaurantLabel={restaurantLabel}
              backToResults={backToResults}
              setStep={setStep}
            />

            <FlowCard step={step} />
          </aside>
        </div>
      </section>

      <MobileActionBar
        step={step}
        nextButtonText={nextButtonText}
        nextStep={nextStep}
        backToResults={backToResults}
        restaurant={restaurant}
        activity={activity}
        restaurantLabel={restaurantLabel}
      />
    </main>
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
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <button
        onClick={() => (window.location.href = "/create")}
        className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/50 transition hover:bg-white hover:text-black sm:px-4 sm:text-xs"
      >
        Results
      </button>

      {steps.map((item, index) => {
        const active = step === item;

        return (
          <button
            key={item}
            onClick={() => setStep(item)}
            className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition sm:px-4 sm:text-xs ${
              active
                ? "bg-red-600 text-white"
                : "border border-white/10 bg-white/[0.05] text-white/50 hover:bg-white hover:text-black"
            }`}
          >
            {index + 1}. {item}
          </button>
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
    <article className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d0d0d] shadow-2xl shadow-black/40 sm:rounded-[2.25rem]">
      <div className="relative h-52 overflow-hidden sm:h-72">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-neutral-500">
            No image available
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />

        <div className="absolute left-3 top-3 max-w-[70%] rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black sm:left-4 sm:top-4 sm:px-4 sm:py-2 sm:text-xs">
          {eyebrow}
        </div>

        {rating && (
          <div className="absolute bottom-3 right-3 rounded-full bg-red-600 px-3 py-1.5 text-[10px] font-black text-white sm:bottom-4 sm:right-4 sm:px-4 sm:py-2 sm:text-xs">
            {flowers(rating)} {rating}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6">
        <h2 className="break-words text-2xl font-black leading-tight sm:text-3xl">
          {title}
        </h2>

        {address && (
          <p className="mt-3 text-sm leading-6 text-white/55">{address}</p>
        )}

        {reviewCount ? (
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35 sm:text-xs">
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

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
    <section className="rounded-[1.75rem] border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl sm:rounded-[2rem] sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
        Confirm
      </p>

      <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
        Confirm your selected outing.
      </h2>

      <div className="mt-6 grid gap-4">
        {restaurant && (
          <ConfirmRow label={restaurantLabel} value={restaurant.restaurant_name} />
        )}

        {activity && <ConfirmRow label="Activity" value={activity.activity_name} />}
      </div>
    </section>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-black sm:text-xl">{value}</p>
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
    <section className="rounded-[1.75rem] border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl sm:rounded-[2rem] sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
        Book
      </p>

      <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
        Finish booking your outing.
      </h2>

      <div className="mt-6 grid gap-4">
        {restaurant && (
          <BookBox
            title={restaurant.restaurant_name}
            reservationUrl={
              restaurant.reservation_url || restaurant.reservation_link
            }
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

function BookBox({
  title,
  reservationUrl,
  websiteUrl,
  mapsUrl,
  reserveLabel,
}: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
      <h3 className="break-words text-lg font-black sm:text-xl">{title}</h3>

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

function NextStepCard({
  step,
  restaurant,
  activity,
  restaurantLabel,
  backToResults,
  setStep,
}: {
  step: Step;
  restaurant: any;
  activity: any;
  restaurantLabel: string;
  backToResults: () => void;
  setStep: (step: Step) => void;
}) {
  return (
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
            {restaurant?.reservation_url || restaurant?.reservation_link ? (
              <a
                href={restaurant.reservation_url || restaurant.reservation_link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-red-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-red-500"
              >
                Reserve {restaurantLabel}
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
  );
}

function FlowCard({ step }: { step: Step }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
        Flow
      </p>

      <div className="mt-5 space-y-4">
        <TimelineItem active={step === "plan"} number="1" title="Plan" />
        <TimelineItem active={step === "confirm"} number="2" title="Confirm" />
        <TimelineItem active={step === "book"} number="3" title="Book" />
      </div>
    </section>
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
        <p
          className={`text-sm font-black ${
            active ? "text-white" : "text-white/45"
          }`}
        >
          {title}
        </p>
        <p className="text-xs font-bold text-white/35">
          RoseOut planning step
        </p>
      </div>
    </div>
  );
}

function MobileActionBar({
  step,
  nextButtonText,
  nextStep,
  backToResults,
  restaurant,
  activity,
  restaurantLabel,
}: {
  step: Step;
  nextButtonText: string;
  nextStep: () => void;
  backToResults: () => void;
  restaurant: any;
  activity: any;
  restaurantLabel: string;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 p-3 backdrop-blur-2xl lg:hidden">
      <div className="grid gap-2">
        {step !== "book" ? (
          <button
            onClick={nextStep}
            className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white"
          >
            {nextButtonText}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {restaurant?.reservation_url || restaurant?.reservation_link ? (
              <a
                href={restaurant.reservation_url || restaurant.reservation_link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-red-600 px-4 py-3 text-center text-xs font-black text-white"
              >
                Reserve {restaurantLabel}
              </a>
            ) : null}

            {activity?.reservation_url || activity?.reservation_link ? (
              <a
                href={activity.reservation_url || activity.reservation_link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-xs font-black text-red-100"
              >
                Book Activity
              </a>
            ) : null}
          </div>
        )}

        <button
          onClick={backToResults}
          className="rounded-2xl border border-white/15 px-5 py-3 text-xs font-black text-white"
        >
          Back to Results
        </button>
      </div>
    </div>
  );
}