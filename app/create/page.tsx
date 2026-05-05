"use client";

import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import RoseOutHeader from "@/components/RoseOutHeader";
import { trackAnalytics } from "@/lib/trackAnalytics";
import { clampScore } from "@/lib/clampScore";

type RestaurantCard = {
  id: string;
  restaurant_name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  cuisine?: string | null;
  food_type?: string | null;
  cuisine_tags?: string[] | null;
  atmosphere?: string | null;
  price_range?: string | null;
  roseout_score: number;
  smart_match_score?: number | null;
  reservation_link?: string | null;
  reservation_url?: string | null;
  website?: string | null;
  image_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
  review_score?: number | null;
  review_keywords?: string[] | null;
  review_snippet?: string | null;
  primary_tag?: string | null;
  date_style_tags?: string[] | null;
  distance_miles?: number | null;
};

type ActivityCard = {
  id: string;
  activity_name: string;
  activity_type?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  price_range?: string | null;
  atmosphere?: string | null;
  group_friendly?: boolean | null;
  roseout_score: number;
  smart_match_score?: number | null;
  reservation_link?: string | null;
  reservation_url?: string | null;
  website?: string | null;
  image_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
  review_score?: number | null;
  review_keywords?: string[] | null;
  review_snippet?: string | null;
  primary_tag?: string | null;
  date_style_tags?: string[] | null;
  distance_miles?: number | null;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  restaurants?: RestaurantCard[];
  activities?: ActivityCard[];
};

type ApiResponse = {
  reply?: string;
  restaurants?: RestaurantCard[];
  activities?: ActivityCard[];
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

const LOCATION_KEY = "roseout_user_location";

const typingSearches = [
  "Steak dinner with bowling in Queens",
  "Romantic Italian dinner in Brooklyn",
  "Birthday brunch with rooftop vibes",
  "Affordable date night near me",
  "Sushi with karaoke after dinner",
  "Luxury seafood dinner in Manhattan",
  "Hookah lounge with food nearby",
  "Fun date night with arcade games",
];

const loadingLines = [
  "Matching your vibe...",
  "Checking food and activity signals...",
  "Building tighter RoseOut picks...",
  "Finding the best fit...",
];

export default function CreatePage() {
  const [input, setInput] = useState("");
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [error, setError] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<RestaurantCard | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityCard | null>(
    null
  );
  const [locationSaved, setLocationSaved] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const viewedItems = useRef<Set<string>>(new Set());

  const latestAssistant = useMemo(
    () =>
      [...messages].reverse().find((message) => message.role === "assistant"),
    [messages]
  );

  useEffect(() => {
    document.title = "Create Your Outing | RoseOut";
    setLocationSaved(Boolean(getSavedLocation()));
  }, []);

  useEffect(() => {
    let searchIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    function typeLoop() {
      const currentSearch = typingSearches[searchIndex];

      if (!deleting) {
        setTypedPlaceholder(currentSearch.slice(0, charIndex + 1));
        charIndex++;

        if (charIndex === currentSearch.length) {
          deleting = true;
          timeout = setTimeout(typeLoop, 1300);
          return;
        }
      } else {
        setTypedPlaceholder(currentSearch.slice(0, charIndex - 1));
        charIndex--;

        if (charIndex === 0) {
          deleting = false;
          searchIndex = (searchIndex + 1) % typingSearches.length;
        }
      }

      timeout = setTimeout(typeLoop, deleting ? 35 : 55);
    }

    typeLoop();

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!loading) return;

    const timer = window.setInterval(() => {
      setLoadingIndex((current) => (current + 1) % loadingLines.length);
    }, 1400);

    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    const latest = latestAssistant;
    if (!latest) return;

    [...(latest.restaurants || []), ...(latest.activities || [])].forEach(
      (item: any) => {
        const itemType = item.restaurant_name ? "restaurant" : "activity";
        const key = `${itemType}-${item.id}`;

        if (!item.id || viewedItems.current.has(key)) return;

        viewedItems.current.add(key);

        trackAnalytics({
          itemId: String(item.id),
          itemType,
          eventType: "view",
        });
      }
    );
  }, [latestAssistant]);

  function getSavedLocation(): UserLocation | null {
    if (typeof window === "undefined") return null;

    try {
      const saved = localStorage.getItem(LOCATION_KEY);
      if (!saved) return null;

      const parsed = JSON.parse(saved);

      if (
        typeof parsed.latitude === "number" &&
        typeof parsed.longitude === "number"
      ) {
        return parsed;
      }

      return null;
    } catch {
      return null;
    }
  }

  function requestUserLocation() {
    if (!navigator.geolocation) {
      setError("Location is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        localStorage.setItem(LOCATION_KEY, JSON.stringify(userLocation));
        setLocationSaved(true);
        setError("");
      },
      () => {
        setLocationSaved(false);
        setError("Please allow location access or search by neighborhood.");
      }
    );
  }

  function resetSearch() {
    setInput("");
    setMessages([]);
    setSelectedRestaurant(null);
    setSelectedActivity(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    inputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleInputChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(event.target.value);

    const element = inputRef.current;
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 150)}px`;
  }

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();

    const cleanInput = input.trim();

    if (!cleanInput || loading) return;

    setLoading(true);
    setError("");

    const userMessage: Message = {
      role: "user",
      content: cleanInput,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const savedLocation = getSavedLocation();

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: cleanInput,
          messages: [...messages, userMessage],
          ...(savedLocation
            ? {
                latitude: savedLocation.latitude,
                longitude: savedLocation.longitude,
                lat: savedLocation.latitude,
                lng: savedLocation.longitude,
              }
            : {}),
        }),
      });

      const data: ApiResponse & { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "RoseOut could not create results.");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content:
          data.reply ||
          "Here are strong RoseOut matches based on your outing request.",
        restaurants: data.restaurants || [],
        activities: data.activities || [],
      };

      setMessages((current) => [...current, assistantMessage]);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function trackRestaurantClick(id: string) {
    trackAnalytics({
      itemId: id,
      itemType: "restaurant",
      eventType: "click",
    });
  }

  function trackActivityClick(id: string) {
    trackAnalytics({
      itemId: id,
      itemType: "activity",
      eventType: "click",
    });
  }

  function savePlan() {
    if (typeof window === "undefined") return;

    localStorage.setItem(
      "roseout_plan",
      JSON.stringify({
        restaurant: selectedRestaurant,
        activity: selectedActivity,
        savedAt: Date.now(),
      })
    );
  }

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-black text-white">
      <RoseOutHeader />

      <section className="relative w-full max-w-full overflow-x-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(225,6,42,0.22),transparent_34%),linear-gradient(180deg,#050505_0%,#0b0b0b_100%)] px-4 pb-8 pt-28 sm:px-6 sm:pb-10 lg:pt-32">
        <div className="mx-auto grid w-full max-w-7xl min-w-0 gap-6 overflow-hidden lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="flex min-w-0 max-w-full flex-col justify-center">
            <div className="mb-4 inline-flex w-fit max-w-full rounded-full border border-[#e1062a]/30 bg-[#e1062a]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-red-100">
              AI Outing Planner
            </div>

            <h1 className="max-w-full break-words text-4xl font-black tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              Plan less. <span className="text-[#e1062a]">RoseOut</span> more.
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/55 sm:text-base">
              Type exactly what you want. RoseOut matches food, activities,
              location, vibe, and budget into a tighter outing plan.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#111]/90 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl transition focus-within:border-[#e1062a]/45 focus-within:shadow-[0_0_0_1px_rgba(225,6,42,0.28),0_0_34px_rgba(225,6,42,0.18)] sm:p-5"
          >
            <div className="min-w-0">
              <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                <p className="min-w-0 truncate text-[10px] font-black uppercase tracking-[0.22em] text-[#e1062a]">
                  Create your plan
                </p>

                {locationSaved ? (
                  <span className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                    Location On
                  </span>
                ) : null}
              </div>

              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={2}
                placeholder={
                  typedPlaceholder
                    ? `${typedPlaceholder}|`
                    : "Tell RoseOut what you want..."
                }
                className="max-h-[150px] min-h-[92px] w-full min-w-0 max-w-full resize-none overflow-y-auto rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#e1062a]/70 sm:min-h-[104px] sm:text-base sm:leading-7"
              />
            </div>

            <div className="mt-4 flex w-full min-w-0 justify-center">
              <div className="flex w-full min-w-0 flex-col justify-center gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="w-full rounded-full bg-[#e1062a] px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-red-950/40 transition hover:bg-[#ff1744] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  {loading ? "Finding Matches..." : "Build My Outing"}
                </button>

                <button
                  type="button"
                  onClick={requestUserLocation}
                  className={`w-full rounded-full border px-6 py-3 text-xs font-black uppercase tracking-[0.12em] transition sm:w-auto ${
                    locationSaved
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                      : "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {locationSaved ? "Location On" : "Use My Location"}
                </button>

                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="w-full rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/55 transition hover:text-white sm:w-auto"
                  >
                    New Search
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </section>

      <section
        ref={resultsRef}
        className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8"
      >
        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">
            {error}
          </div>
        )}

        {!messages.length && !loading && <StartPanel />}

        <div className="space-y-5">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const restaurants = message.restaurants || [];
            const activities = message.activities || [];
            const hasCards = restaurants.length > 0 || activities.length > 0;

            if (isUser) {
              return (
                <div key={index} className="flex justify-end">
                  <div className="max-w-full rounded-2xl bg-[#e1062a] px-4 py-3 text-sm font-black leading-6 text-white shadow-lg shadow-red-950/30 sm:max-w-3xl">
                    {message.content}
                  </div>
                </div>
              );
            }

            if (!hasCards) {
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-[#101010] p-4 text-sm font-semibold leading-7 text-white/70"
                >
                  {message.content}
                </div>
              );
            }

            return (
              <div
                key={index}
                className="w-full max-w-full overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#080808] p-3 shadow-2xl shadow-black/40 sm:p-4"
              >
                <div className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#e1062a]">
                      Curated Results
                    </p>
                    <h2 className="mt-1 break-words text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                      Tight matches for your outing
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-white/40">
                      Compact picks. Less scrolling. Better decision-making.
                    </p>
                  </div>

                  {(selectedRestaurant || selectedActivity) && (
                    <button
                      type="button"
                      onClick={savePlan}
                      className="rounded-full border border-[#e1062a]/40 bg-[#e1062a]/10 px-4 py-2 text-xs font-black text-red-100 transition hover:bg-[#e1062a] hover:text-white"
                    >
                      Save Selected Plan
                    </button>
                  )}
                </div>

                {restaurants.length > 0 && (
                  <ResultSection
                    title="Restaurant Picks"
                    subtitle="Food spots matched to cuisine, vibe, and location"
                  >
                    {restaurants.map((restaurant, restaurantIndex) => {
                      const restaurantId = String(restaurant.id);
                      const isSelected =
                        selectedRestaurant?.id === restaurant.id;
                      const reservationUrl =
                        restaurant.reservation_url ||
                        restaurant.reservation_link ||
                        undefined;

                      return (
                        <ResultCard
                          key={restaurantId || restaurantIndex}
                          index={restaurantIndex}
                          type="restaurant"
                          id={restaurantId}
                          imageUrl={restaurant.image_url || undefined}
                          title={restaurant.restaurant_name}
                          eyebrow={
                            restaurant.cuisine ||
                            restaurant.food_type ||
                            "Restaurant"
                          }
                          address={formatAddress(restaurant)}
                          rating={restaurant.rating}
                          reviewCount={restaurant.review_count}
                          reviewKeywords={restaurant.review_keywords}
                          reviewSnippet={restaurant.review_snippet}
                          primaryTag={restaurant.primary_tag}
                          tags={[
                            ...(restaurant.cuisine_tags || []),
                            ...(restaurant.date_style_tags || []),
                          ]}
                          distance={restaurant.distance_miles}
                          score={
                            restaurant.smart_match_score ||
                            restaurant.roseout_score
                          }
                          selected={isSelected}
                          priority={restaurantIndex === 0}
                          selectLabel={isSelected ? "Selected" : "Select"}
                          onSelect={() =>
                            setSelectedRestaurant(
                              selectedRestaurant?.id === restaurant.id
                                ? null
                                : restaurant
                            )
                          }
                          detailsHref={`/locations/restaurants/${restaurantId}?from=/create`}
                          onDetails={() => trackRestaurantClick(restaurantId)}
                          websiteUrl={restaurant.website || undefined}
                          onWebsite={() => trackRestaurantClick(restaurantId)}
                          reservationUrl={reservationUrl}
                          reservationLabel="Reserve"
                          onReservation={() =>
                            trackRestaurantClick(restaurantId)
                          }
                        />
                      );
                    })}
                  </ResultSection>
                )}

                {activities.length > 0 && (
                  <ResultSection
                    title="Experience Picks"
                    subtitle="Activities matched to your outing plan"
                  >
                    {activities.map((activity, activityIndex) => {
                      const activityId = String(activity.id);
                      const isSelected = selectedActivity?.id === activity.id;
                      const reservationUrl =
                        activity.reservation_url ||
                        activity.reservation_link ||
                        undefined;

                      return (
                        <ResultCard
                          key={activityId || activityIndex}
                          index={activityIndex}
                          type="activity"
                          id={activityId}
                          imageUrl={activity.image_url || undefined}
                          title={activity.activity_name}
                          eyebrow={activity.activity_type || "Activity"}
                          address={formatAddress(activity)}
                          rating={activity.rating}
                          reviewCount={activity.review_count}
                          reviewKeywords={activity.review_keywords}
                          reviewSnippet={activity.review_snippet}
                          primaryTag={activity.primary_tag}
                          tags={activity.date_style_tags || []}
                          distance={activity.distance_miles}
                          score={
                            activity.smart_match_score || activity.roseout_score
                          }
                          selected={isSelected}
                          priority={activityIndex === 0}
                          selectLabel={isSelected ? "Selected" : "Select"}
                          onSelect={() =>
                            setSelectedActivity(
                              selectedActivity?.id === activity.id
                                ? null
                                : activity
                            )
                          }
                          detailsHref={`/locations/activities/${activityId}?from=/create`}
                          onDetails={() => trackActivityClick(activityId)}
                          websiteUrl={activity.website || undefined}
                          onWebsite={() => trackActivityClick(activityId)}
                          reservationUrl={reservationUrl}
                          reservationLabel="Book"
                          onReservation={() => trackActivityClick(activityId)}
                        />
                      );
                    })}
                  </ResultSection>
                )}
              </div>
            );
          })}

          {loading && <LoadingResults label={loadingLines[loadingIndex]} />}
        </div>
      </section>

      <footer className="w-full max-w-full overflow-x-hidden border-t border-white/10 bg-black px-4 py-8 text-white sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-black">
              Rose<span className="text-[#e1062a]">Out</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-white/40">
              AI outing plans for food, activities, and better nights out.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm font-bold text-white/40">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/business" className="hover:text-white">
              For Businesses
            </Link>
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html,
        body {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }

        * {
          box-sizing: border-box;
        }

        @keyframes cardReveal {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}

function StartPanel() {
  const items = [
    {
      title: "Tell RoseOut the full idea",
      body: "Use a natural sentence with food, activity, location, budget, or vibe.",
    },
    {
      title: "RoseOut separates the intent",
      body: "A steak request is treated differently from bowling, karaoke, lounges, or brunch.",
    },
    {
      title: "Get tighter matched cards",
      body: "Results are ranked for fit, quality, distance, and outing flow.",
    },
  ];

  return (
    <div className="w-full max-w-full overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl shadow-black/40">
      <div className="grid w-full min-w-0 gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={item.title}
            className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
          >
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#e1062a] text-sm font-black text-white">
              {index + 1}
            </div>

            <h3 className="break-words text-base font-black tracking-[-0.02em] text-white">
              {item.title}
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-white/45">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 w-full max-w-full overflow-hidden last:mb-0">
      <div className="mb-3 flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-xl font-black tracking-[-0.03em] text-white">
            {title}
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-white/38">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="grid w-full min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function ResultCard({
  index,
  type,
  id,
  imageUrl,
  title,
  eyebrow,
  address,
  rating,
  reviewCount,
  reviewKeywords,
  reviewSnippet,
  primaryTag,
  tags,
  distance,
  score,
  selected,
  priority,
  selectLabel,
  onSelect,
  detailsHref,
  onDetails,
  websiteUrl,
  onWebsite,
  reservationUrl,
  reservationLabel,
  onReservation,
}: {
  index: number;
  type: "restaurant" | "activity";
  id: string;
  imageUrl?: string;
  title: string;
  eyebrow: string;
  address: string;
  rating?: number | null;
  reviewCount?: number | null;
  reviewKeywords?: string[] | null;
  reviewSnippet?: string | null;
  primaryTag?: string | null;
  tags?: string[] | null;
  distance?: number | null;
  score: number;
  selected: boolean;
  priority: boolean;
  selectLabel: string;
  onSelect: () => void;
  detailsHref: string;
  onDetails: () => void;
  websiteUrl?: string;
  onWebsite?: () => void;
  reservationUrl?: string;
  reservationLabel?: string;
  onReservation?: () => void;
}) {
  const safeScore = clampScore(score || 0);
  const cleanTags = getDisplayTags({
    type,
    eyebrow,
    primaryTag,
    tags,
    reviewKeywords,
    reviewSnippet,
    title,
  });

  const whyPicked = getWhyPicked({
    primaryTag,
    reviewKeywords,
    reviewSnippet,
    type,
  });

  const cleanReviewKeywords = toArray(reviewKeywords).slice(0, 2);

  return (
    <article
      className={`group relative flex h-full min-h-[445px] w-full min-w-0 max-w-full flex-col overflow-hidden rounded-[1.1rem] border bg-[#101010] shadow-xl shadow-black/30 transition duration-300 hover:border-[#e1062a]/55 hover:bg-[#141414] hover:shadow-[0_0_36px_rgba(225,6,42,0.16)] ${
        selected
          ? "border-[#e1062a] ring-2 ring-[#e1062a]/35"
          : "border-white/10"
      }`}
      style={{
        animation: `cardReveal 360ms ease-out ${index * 70}ms both`,
      }}
    >
      <div className="relative h-[150px] w-full overflow-hidden bg-neutral-950 sm:h-[165px]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            unoptimized
            priority={priority}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-700 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-bold text-white/30">
            No image available
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-black/50 to-black/5" />

        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/75 px-3 py-1.5 backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
            Match
          </p>
          <p className="text-sm font-black text-white">
            {Math.round(safeScore)}
          </p>
        </div>

        <div className="absolute right-3 top-3 flex max-w-[62%] flex-wrap justify-end gap-1.5">
          {cleanTags.slice(0, 2).map((tag) => (
            <span
              key={`${tag.label}-${tag.tone}`}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] backdrop-blur-md ${tagToneClass(
                tag.tone
              )}`}
            >
              {tag.label}
            </span>
          ))}
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          {distance !== null && distance !== undefined ? (
            <span className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur">
              {distance} mi
            </span>
          ) : null}

          {rating ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-black">
              🌹 {rating}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3.5">
        <div className="min-h-[122px] min-w-0">
          <div className="mb-1.5 flex min-w-0 items-center justify-between gap-2">
            <p className="line-clamp-1 min-w-0 text-[10px] font-black uppercase tracking-[0.22em] text-[#e1062a]">
              {titleCase(eyebrow || type)}
            </p>

            {reviewCount ? (
              <p className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-black uppercase text-white/40">
                {formatCount(reviewCount)} reviews
              </p>
            ) : null}
          </div>

          <Link href={detailsHref} onClick={onDetails}>
            <h3 className="line-clamp-1 break-words text-lg font-black leading-tight tracking-[-0.03em] text-white transition group-hover:text-red-100">
              {title}
            </h3>
          </Link>

          <p className="mt-1.5 line-clamp-2 min-h-[38px] break-words text-xs font-semibold leading-5 text-white/42">
            {address || "Location details available on the listing."}
          </p>

          <div className="mt-2 flex min-h-[24px] flex-wrap gap-1.5">
            {cleanTags.slice(0, 3).map((tag) => (
              <span
                key={`mini-${tag.label}-${tag.tone}`}
                className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[11px] font-bold text-white/56"
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.045] p-3 backdrop-blur-md">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/32">
            Why RoseOut picked this
          </p>
          <p className="mt-1.5 line-clamp-2 break-words text-xs font-semibold leading-5 text-white/62">
            {whyPicked}
          </p>
        </div>

        <div className="mt-2 min-h-[26px]">
          {cleanReviewKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {cleanReviewKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-[#e1062a]/20 bg-[#e1062a]/10 px-2.5 py-1 text-[11px] font-bold text-red-100/85"
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : primaryTag ? (
            <p className="line-clamp-1 text-xs font-black text-white/65">
              ✨ {titleCase(primaryTag)}
            </p>
          ) : null}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={onSelect}
            className={`rounded-full px-3 py-2.5 text-xs font-black transition ${
              selected
                ? "bg-[#e1062a] text-white"
                : "border border-white/12 text-white/85 hover:bg-white hover:text-black"
            }`}
          >
            {selectLabel}
          </button>

          <Link
            href={detailsHref}
            onClick={onDetails}
            className="rounded-full bg-white px-3 py-2.5 text-center text-xs font-black text-black transition hover:bg-red-100"
          >
            Details
          </Link>

          {websiteUrl ? (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onWebsite}
              className="rounded-full border border-white/12 px-3 py-2.5 text-center text-xs font-black text-white/80 transition hover:bg-white hover:text-black"
            >
              Website
            </a>
          ) : null}

          {reservationUrl ? (
            <a
              href={reservationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onReservation}
              className="rounded-full border border-[#e1062a]/35 bg-[#e1062a]/10 px-3 py-2.5 text-center text-xs font-black text-red-100 transition hover:bg-[#e1062a] hover:text-white"
            >
              {reservationLabel || "Book"}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function LoadingResults({ label }: { label: string }) {
  return (
    <div className="w-full max-w-full overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#080808] p-4 shadow-2xl shadow-black/40">
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#e1062a]">
          RoseOut is searching
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
          {label}
        </h2>
      </div>

      <div className="grid w-full min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-[445px] overflow-hidden rounded-[1.1rem] border border-white/10 bg-[#101010]"
          >
            <div className="h-[165px] animate-pulse bg-white/[0.06]" />
            <div className="space-y-3 p-3.5">
              <div className="h-3 w-24 animate-pulse rounded-full bg-[#e1062a]/20" />
              <div className="h-5 w-3/4 animate-pulse rounded-full bg-white/[0.08]" />
              <div className="h-4 w-full animate-pulse rounded-full bg-white/[0.06]" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-white/[0.05]" />
              <div className="h-20 animate-pulse rounded-xl bg-white/[0.045]" />
              <div className="h-10 animate-pulse rounded-full bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatAddress(item: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
}) {
  return [item.address, item.city, item.state, item.zip_code]
    .filter(Boolean)
    .join(", ");
}

function formatCount(value: number) {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(value);
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function toArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getDisplayTags({
  type,
  eyebrow,
  primaryTag,
  tags,
  reviewKeywords,
  reviewSnippet,
  title,
}: {
  type: "restaurant" | "activity";
  eyebrow?: string | null;
  primaryTag?: string | null;
  tags?: string[] | null;
  reviewKeywords?: string[] | null;
  reviewSnippet?: string | null;
  title?: string | null;
}) {
  const sourceText = [
    type,
    eyebrow,
    primaryTag,
    ...(tags || []),
    ...(reviewKeywords || []),
    reviewSnippet,
    title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const results: { label: string; tone: "rose" | "gold" | "purple" }[] = [];

  const add = (label: string, tone: "rose" | "gold" | "purple") => {
    if (
      !results.some(
        (item) => item.label.toLowerCase() === label.toLowerCase()
      )
    ) {
      results.push({ label, tone });
    }
  };

  if (sourceText.includes("luxury") || sourceText.includes("upscale")) {
    add("Luxury", "gold");
  }

  if (
    sourceText.includes("fine dining") ||
    sourceText.includes("steak") ||
    sourceText.includes("restaurant") ||
    sourceText.includes("dinner") ||
    sourceText.includes("food")
  ) {
    add("Full Dining", "rose");
  }

  if (
    sourceText.includes("nightlife") ||
    sourceText.includes("lounge") ||
    sourceText.includes("cocktail") ||
    sourceText.includes("bar") ||
    sourceText.includes("club")
  ) {
    add("Nightlife", "purple");
  }

  if (
    sourceText.includes("romantic") ||
    sourceText.includes("intimate") ||
    sourceText.includes("anniversary")
  ) {
    add("Romantic", "rose");
  }

  if (sourceText.includes("birthday") || sourceText.includes("celebration")) {
    add("Birthday", "rose");
  }

  if (sourceText.includes("rooftop") || sourceText.includes("skyline")) {
    add("Rooftop", "gold");
  }

  if (sourceText.includes("brunch") || sourceText.includes("breakfast")) {
    add("Brunch", "rose");
  }

  if (
    sourceText.includes("bowling") ||
    sourceText.includes("arcade") ||
    sourceText.includes("karaoke") ||
    sourceText.includes("comedy") ||
    sourceText.includes("fun")
  ) {
    add("Fun", "purple");
  }

  if (sourceText.includes("hookah") || sourceText.includes("shisha")) {
    add("Hookah", "purple");
  }

  if (sourceText.includes("cigar")) {
    add("Cigar", "gold");
  }

  if (results.length === 0) {
    add(titleCase(primaryTag || eyebrow || type), "rose");
  }

  return results.slice(0, 3);
}

function tagToneClass(tone: "rose" | "gold" | "purple") {
  if (tone === "gold") {
    return "border-amber-300/40 bg-amber-300/20 text-amber-100";
  }

  if (tone === "purple") {
    return "border-fuchsia-400/35 bg-fuchsia-500/18 text-fuchsia-100";
  }

  return "border-[#e1062a]/45 bg-[#e1062a]/22 text-red-50";
}

function getWhyPicked({
  primaryTag,
  reviewKeywords,
  reviewSnippet,
  type,
}: {
  primaryTag?: string | null;
  reviewKeywords?: string[] | null;
  reviewSnippet?: string | null;
  type: "restaurant" | "activity";
}) {
  const keywords = toArray(reviewKeywords).slice(0, 2);

  if (keywords.length > 0) {
    return `Matched for ${keywords.join(" and ")} signals.`;
  }

  if (reviewSnippet) {
    return reviewSnippet;
  }

  if (primaryTag) {
    return `Matched for its ${titleCase(primaryTag).toLowerCase()} fit.`;
  }

  return type === "restaurant"
    ? "Matched to your food, location, and vibe."
    : "Matched to your activity and outing vibe.";
}