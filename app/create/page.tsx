"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackAnalytics } from "@/lib/trackAnalytics";
import { clampScore } from "@/lib/clampScore";

type RestaurantCard = {
  id: string;
  restaurant_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  roseout_score: number;
  reservation_link?: string;
  reservation_url?: string;
  website?: string;
  image_url?: string;
  rating?: number | null;
  review_count?: number | null;
  primary_tag?: string | null;
  date_style_tags?: string[];
  price_range?: string | null;
  distance_miles?: number | null;
};

type ActivityCard = {
  id: string;
  activity_name: string;
  activity_type?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price_range?: string;
  atmosphere?: string;
  group_friendly?: boolean;
  roseout_score: number;
  reservation_link?: string;
  reservation_url?: string;
  website?: string;
  image_url?: string;
  rating?: number | null;
  review_count?: number | null;
  primary_tag?: string | null;
  date_style_tags?: string[];
  distance_miles?: number | null;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  restaurants?: RestaurantCard[];
  activities?: ActivityCard[];
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

type SavedCreateState = {
  input: string;
  messages: Message[];
  selectedRestaurant: RestaurantCard | null;
  selectedActivity: ActivityCard | null;
  scrollY: number;
};

const STORAGE_KEY = "roseout_create_state";
const LOCATION_KEY = "roseout_user_location";

function TypingText({ text }: { text: string }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    setDisplay("");
    let index = 0;

    const interval = setInterval(() => {
      setDisplay(text.slice(0, index + 1));
      index++;

      if (index >= text.length) clearInterval(interval);
    }, 28);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {display}
      <span className="animate-pulse">|</span>
    </span>
  );
}

function SkeletonCards() {
  const messages = [
    "Curating your perfect outing…",
    "Finding top-rated spots for you…",
    "Matching vibe, distance, and experience…",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-6 rounded-[2rem] border border-black/10 bg-[#f7f3ed] p-6 text-black shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="mb-6 text-center">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500">
          RoseOut
        </p>

        <h2 className="mt-2 text-2xl font-black">
          <TypingText text={messages[index]} />
        </h2>

        <p className="mt-2 text-sm text-neutral-500">
          Building your results now.
        </p>
      </div>

      <div className="grid gap-6">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-xl"
          >
            <div className="relative h-72 w-full overflow-hidden bg-neutral-200">
              <div className="absolute inset-0 animate-pulse bg-neutral-300" />
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </div>

            <div className="p-5">
              <div className="h-3 w-24 animate-pulse rounded-full bg-neutral-300" />
              <div className="mt-4 h-8 w-64 animate-pulse rounded-full bg-neutral-300" />
              <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-neutral-200" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-neutral-200" />

              <div className="mt-5 flex gap-2">
                <div className="h-8 w-20 animate-pulse rounded-full bg-neutral-200" />
                <div className="h-8 w-24 animate-pulse rounded-full bg-neutral-200" />
                <div className="h-8 w-20 animate-pulse rounded-full bg-neutral-200" />
              </div>

              <div className="mt-6 flex gap-3">
                <div className="h-11 w-24 animate-pulse rounded-full bg-neutral-300" />
                <div className="h-11 w-32 animate-pulse rounded-full bg-neutral-900" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

function ResultIntro({
  restaurantsCount,
  activitiesCount,
}: {
  restaurantsCount: number;
  activitiesCount: number;
}) {
  const total = restaurantsCount + activitiesCount;

  const text =
    total > 0
      ? `RoseOut found ${total} great option${total === 1 ? "" : "s"} for you.`
      : "RoseOut found curated results for you.";

  return (
    <div className="mb-6">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500">
        Curated Results
      </p>

      <h2 className="mt-2 text-2xl font-black text-black">
        <TypingText text={text} />
      </h2>

      <p className="mt-1 text-sm font-medium text-neutral-500">
        Select your favorites or view full details.
      </p>
    </div>
  );
}

export default function CreatePage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationSaved, setLocationSaved] = useState(false);

  const viewedItems = useRef<Set<string>>(new Set());

  const [selectedRestaurant, setSelectedRestaurant] =
    useState<RestaurantCard | null>(null);

  const [selectedActivity, setSelectedActivity] =
    useState<ActivityCard | null>(null);

  const getSavedUserLocation = (): UserLocation | null => {
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
  };

  const requestUserLocation = () => {
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
        setError("Please allow location access or search by zip code.");
      }
    );
  };

  const saveCreateState = () => {
    const state: SavedCreateState = {
      input,
      messages,
      selectedRestaurant,
      selectedActivity,
      scrollY: window.scrollY,
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const resetSearch = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("roseout_plan");

    setInput("");
    setMessages([]);
    setSelectedRestaurant(null);
    setSelectedActivity(null);
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setLocationSaved(!!getSavedUserLocation());

    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as SavedCreateState;

      setInput(parsed.input || "");
      setMessages(parsed.messages || []);
      setSelectedRestaurant(parsed.selectedRestaurant || null);
      setSelectedActivity(parsed.selectedActivity || null);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: parsed.scrollY || 0,
            behavior: "instant" as ScrollBehavior,
          });
        });
      });
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => saveCreateState();

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  });

  useEffect(() => {
    messages.forEach((msg) => {
      msg.restaurants?.forEach((r) => {
        const key = `restaurant-${r.id}`;

        if (!viewedItems.current.has(key)) {
          viewedItems.current.add(key);
          trackAnalytics({
            itemId: r.id,
            itemType: "restaurant",
            eventType: "view",
          });
        }
      });

      msg.activities?.forEach((a) => {
        const key = `activity-${a.id}`;

        if (!viewedItems.current.has(key)) {
          viewedItems.current.add(key);
          trackAnalytics({
            itemId: a.id,
            itemType: "activity",
            eventType: "view",
          });
        }
      });
    });
  }, [messages]);

  const trackRestaurantClick = (id: string) => {
    trackAnalytics({
      itemId: id,
      itemType: "restaurant",
      eventType: "click",
    });
  };

  const trackActivityClick = (id: string) => {
    trackAnalytics({
      itemId: id,
      itemType: "activity",
      eventType: "click",
    });
  };

  const sendMessage = async () => {
    if (loading) return;

    if (!input.trim()) {
      setError("Please enter what you’re looking for.");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);
    setSelectedRestaurant(null);
    setSelectedActivity(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.slice(-4),
          userLocation: getSavedUserLocation(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      const assistantReply = data.reply || data.message || data.answer || "";

      const updatedMessages: Message[] = [
        ...nextMessages,
        {
          role: "assistant",
          content: assistantReply,
          restaurants: data.restaurants || [],
          activities: data.activities || [],
        },
      ];

      setMessages(updatedMessages);

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          input: "",
          messages: updatedMessages,
          selectedRestaurant: null,
          selectedActivity: null,
          scrollY: window.scrollY,
        })
      );
    } catch {
      setError("Could not create response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPlanButtonText = () => {
    if (selectedRestaurant && selectedActivity) return "View Your Full Plan";
    if (selectedRestaurant) return "View Dinner Plan";
    if (selectedActivity) return "View Activity Plan";
    return "View Your Plan";
  };

  const selectedPlanText =
    selectedRestaurant && selectedActivity
      ? `${selectedRestaurant.restaurant_name} + ${selectedActivity.activity_name}`
      : selectedRestaurant?.restaurant_name ||
        selectedActivity?.activity_name ||
        "";

  const SearchBox = (
    <section className="relative z-10 mb-8 rounded-[1.75rem] border border-white/10 bg-black/80 p-4 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="grid gap-3 md:grid-cols-[1fr_170px] md:items-end">
        <div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              messages.length
                ? "Ask a follow-up question..."
                : "Example: Romantic brunch in Queens"
            }
            className="min-h-[96px] w-full resize-none rounded-[1.35rem] border border-white/10 bg-neutral-950 px-5 py-4 text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none"
          />

          {error && (
            <p className="mt-3 rounded-2xl bg-red-100 p-3 text-sm font-bold text-red-700">
              {error}
            </p>
          )}
        </div>

        <button
          onClick={sendMessage}
          disabled={loading}
          className="rounded-full bg-yellow-500 px-8 py-4 font-black text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Finding..." : messages.length ? "Send" : "Create Plan"}
        </button>
      </div>

      {messages.length === 0 && !loading && (
        <div className="mt-3">
          <button
            type="button"
            onClick={requestUserLocation}
            className={`w-full rounded-full px-4 py-3 text-xs font-extrabold transition sm:text-sm ${
              locationSaved
                ? "bg-green-500 text-black hover:bg-green-400"
                : "border border-white/15 bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {locationSaved ? "✓ Location Saved" : "Use My Location"}
          </button>
        </div>
      )}
    </section>
  );

  return (
    <main className="min-h-screen bg-black px-5 py-6 pb-40 text-white">
      <div className="mx-auto max-w-4xl">
        {messages.length === 0 && (
          <>
            <section className="mb-6 rounded-[2rem] border border-white/10 bg-[#111]/95 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] md:p-8">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-yellow-500">
                RoseOut
              </p>

              <h1 className="max-w-2xl text-4xl font-black tracking-tight md:text-6xl">
                Find your next perfect outing.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-300 md:text-base">
                Search in full sentences. RoseOut finds curated restaurants,
                activities, nearby matches, and premium detail pages.
              </p>
            </section>

            {SearchBox}
          </>
        )}

        {messages.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-500">
                RoseOut
              </p>

              <button
                type="button"
                onClick={resetSearch}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-extrabold text-white backdrop-blur"
              >
                New Search
              </button>
            </div>

            {SearchBox}
          </>
        )}
      </div>

      <div className="relative -mx-5 mt-2 min-h-screen overflow-hidden bg-gradient-to-b from-black via-[#15110d] to-[#d8c5a8] px-5 pt-6 pb-40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%),linear-gradient(to_bottom,rgba(0,0,0,0.12),rgba(216,197,168,0.18))]" />

        <div className="relative z-10 mx-auto max-w-4xl">
          {loading && <SkeletonCards />}

          <section
            className={`space-y-5 transition-opacity duration-700 ${
              loading ? "opacity-40" : "opacity-100"
            }`}
          >
            {messages.map((msg, index) => {
              const hasRestaurants = !!msg.restaurants?.length;
              const hasActivities = !!msg.activities?.length;

              return (
                <div
                  key={index}
                  className={`rounded-[2rem] p-5 transition-all duration-700 ${
                    msg.role === "user"
                      ? "bg-yellow-500 text-black shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
                      : "animate-in fade-in slide-in-from-bottom-4 border border-white/10 bg-[#f7f3ed] text-black shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
                  }`}
                >
                  {msg.role === "user" && (
                    <p className="whitespace-pre-wrap font-black">
                      {msg.content}
                    </p>
                  )}

                  {msg.role === "assistant" &&
                  (hasRestaurants || hasActivities) ? (
                    <>
                      <ResultIntro
                        restaurantsCount={msg.restaurants?.length || 0}
                        activitiesCount={msg.activities?.length || 0}
                      />

                      {hasRestaurants && (
                        <div className="mb-10">
                          <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-[0.25em] text-neutral-500">
                              Restaurants
                            </h2>

                            <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                              Dinner picks
                            </span>
                          </div>

                          <div className="grid gap-6">
                            {msg.restaurants?.map((r, restaurantIndex) => {
                              const restaurantId = String(r.id);
                              const isSelected =
                                selectedRestaurant?.id === r.id;

                              const reservationUrl =
                                r.reservation_url || r.reservation_link;

                              return (
                                <div
                                  key={restaurantId || restaurantIndex}
                                  className={`group animate-in fade-in slide-in-from-bottom-5 overflow-hidden rounded-[1.5rem] border bg-white shadow-xl transition duration-500 hover:-translate-y-1 hover:shadow-2xl ${
                                    isSelected
                                      ? "border-yellow-500 ring-2 ring-yellow-500"
                                      : "border-neutral-200"
                                  }`}
                                >
                                  <div className="relative">
                                    {r.image_url ? (
                                      <Image
                                        src={r.image_url}
                                        alt={r.restaurant_name}
                                        width={900}
                                        height={520}
                                        className="h-72 w-full object-cover transition duration-700 group-hover:scale-105"
                                        priority={restaurantIndex === 0}
                                      />
                                    ) : (
                                      <div className="flex h-72 items-center justify-center bg-neutral-200 text-neutral-500">
                                        No image available
                                      </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

                                    <div className="absolute left-4 top-4 rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                                      {r.roseout_score}/100 Match
                                    </div>

                                    {r.distance_miles !== null &&
                                      r.distance_miles !== undefined && (
                                        <div className="absolute left-4 bottom-4 rounded-full bg-white px-3 py-1 text-xs font-black text-black shadow-lg">
                                          {r.distance_miles} mi away
                                        </div>
                                      )}

                                    {r.roseout_score >= 80 && (
                                      <div className="absolute right-4 top-4 rounded-full bg-yellow-500 px-3 py-1 text-xs font-extrabold text-black">
                                        Top Pick
                                      </div>
                                    )}

                                    {r.rating && (
                                      <div className="absolute bottom-4 right-4 rounded-full bg-white px-3 py-1 text-sm font-black text-black shadow-lg">
                                        ⭐ {r.rating}
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-5">
                                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">
                                      Restaurant
                                    </p>

                                    <h3 className="mt-1 text-2xl font-black tracking-tight text-black">
                                      {r.restaurant_name}
                                    </h3>

                                    <p className="mt-3 text-sm leading-6 text-neutral-600">
                                      {[r.address, r.city, r.state, r.zip_code]
                                        .filter(Boolean)
                                        .join(", ")}
                                    </p>

                                    {r.review_count ? (
                                      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
                                        {r.review_count} reviews
                                      </p>
                                    ) : null}

                                    {r.primary_tag && (
                                      <p className="mt-4 text-sm font-black text-black">
                                        ✨ {r.primary_tag}
                                      </p>
                                    )}

                                    {r.date_style_tags?.length ? (
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        {r.date_style_tags
                                          .slice(0, 3)
                                          .map((tag) => (
                                            <span
                                              key={tag}
                                              className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700"
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                      </div>
                                    ) : null}

                                    <div className="mt-5 flex flex-wrap gap-3">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedRestaurant(
                                            selectedRestaurant?.id === r.id
                                              ? null
                                              : r
                                          )
                                        }
                                        className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                                          isSelected
                                            ? "bg-yellow-500 text-black"
                                            : "border border-black text-black hover:bg-black hover:text-white"
                                        }`}
                                      >
                                        {isSelected ? "Selected" : "Select"}
                                      </button>

                                      <Link
                                        href={`/locations/restaurants/${restaurantId}?from=/create`}
                                        onClick={() => {
                                          saveCreateState();
                                          trackRestaurantClick(restaurantId);
                                        }}
                                        className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800"
                                      >
                                        View Details
                                      </Link>

                                      {reservationUrl && (
                                        <a
                                          href={reservationUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={() =>
                                            trackRestaurantClick(restaurantId)
                                          }
                                          className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-bold text-black transition hover:border-black"
                                        >
                                          Reserve
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {hasActivities && (
                        <div>
                          <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-[0.25em] text-neutral-500">
                              Activities
                            </h2>

                            <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                              Experience picks
                            </span>
                          </div>

                          <div className="grid gap-6">
                            {msg.activities?.map((a, activityIndex) => {
                              const activityId = String(a.id);
                              const isSelected =
                                selectedActivity?.id === a.id;

                              const reservationUrl =
                                a.reservation_url || a.reservation_link;

                              return (
                                <div
                                  key={activityId || activityIndex}
                                  className={`group animate-in fade-in slide-in-from-bottom-5 overflow-hidden rounded-[1.5rem] border bg-white shadow-xl transition duration-500 hover:-translate-y-1 hover:shadow-2xl ${
                                    isSelected
                                      ? "border-yellow-500 ring-2 ring-yellow-500"
                                      : "border-neutral-200"
                                  }`}
                                >
                                  <div className="relative">
                                    {a.image_url ? (
                                      <Image
                                        src={a.image_url}
                                        alt={a.activity_name}
                                        width={900}
                                        height={520}
                                        className="h-72 w-full object-cover transition duration-700 group-hover:scale-105"
                                        priority={activityIndex === 0}
                                      />
                                    ) : (
                                      <div className="flex h-72 items-center justify-center bg-neutral-200 text-neutral-500">
                                        No image available
                                      </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

                                    <div className="absolute left-4 top-4 rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                                      {a.roseout_score}/100 Match
                                    </div>

                                    {a.distance_miles !== null &&
                                      a.distance_miles !== undefined && (
                                        <div className="absolute left-4 bottom-4 rounded-full bg-white px-3 py-1 text-xs font-black text-black shadow-lg">
                                          {a.distance_miles} mi away
                                        </div>
                                      )}

                                    {a.roseout_score >= 80 && (
                                      <div className="absolute right-4 top-4 rounded-full bg-yellow-500 px-3 py-1 text-xs font-extrabold text-black">
                                        Top Pick
                                      </div>
                                    )}

                                    {a.rating && (
                                      <div className="absolute bottom-4 right-4 rounded-full bg-white px-3 py-1 text-sm font-black text-black shadow-lg">
                                        ⭐ {a.rating}
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-5">
                                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">
                                      {a.activity_type || "Activity"}
                                    </p>

                                    <h3 className="mt-1 text-2xl font-black tracking-tight text-black">
                                      {a.activity_name}
                                    </h3>

                                    <p className="mt-3 text-sm leading-6 text-neutral-600">
                                      {[a.address, a.city, a.state, a.zip_code]
                                        .filter(Boolean)
                                        .join(", ")}
                                    </p>

                                    {a.review_count ? (
                                      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
                                        {a.review_count} reviews
                                      </p>
                                    ) : null}

                                    {a.primary_tag && (
                                      <p className="mt-4 text-sm font-black text-black">
                                        ✨ {a.primary_tag}
                                      </p>
                                    )}

                                    {a.date_style_tags?.length ? (
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        {a.date_style_tags
                                          .slice(0, 3)
                                          .map((tag) => (
                                            <span
                                              key={tag}
                                              className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700"
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                      </div>
                                    ) : null}

                                    <div className="mt-5 flex flex-wrap gap-3">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedActivity(
                                            selectedActivity?.id === a.id
                                              ? null
                                              : a
                                          )
                                        }
                                        className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                                          isSelected
                                            ? "bg-yellow-500 text-black"
                                            : "border border-black text-black hover:bg-black hover:text-white"
                                        }`}
                                      >
                                        {isSelected ? "Selected" : "Select"}
                                      </button>

                                      <Link
                                        href={`/locations/activities/${activityId}?from=/create`}
                                        onClick={() => {
                                          saveCreateState();
                                          trackActivityClick(activityId);
                                        }}
                                        className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800"
                                      >
                                        View Details
                                      </Link>

                                      {a.website && (
                                        <a
                                          href={a.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={() =>
                                            trackActivityClick(activityId)
                                          }
                                          className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-bold text-black transition hover:border-black"
                                        >
                                          Website
                                        </a>
                                      )}

                                      {reservationUrl && (
                                        <a
                                          href={reservationUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={() =>
                                            trackActivityClick(activityId)
                                          }
                                          className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-bold text-black transition hover:border-black"
                                        >
                                          Book
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}

                  {msg.role === "assistant" &&
                    !hasRestaurants &&
                    !hasActivities && (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                </div>
              );
            })}
          </section>
        </div>
      </div>

      {(selectedRestaurant || selectedActivity) && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/95 p-4 text-white backdrop-blur">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-500">
              Building your plan
            </p>

            <p className="mt-1 text-sm font-bold">{selectedPlanText}</p>

            <button
              type="button"
              onClick={() => {
                localStorage.setItem(
                  "roseout_plan",
                  JSON.stringify({
                    restaurant: selectedRestaurant,
                    activity: selectedActivity,
                  })
                );

                window.location.href = "/plan";
              }}
              className="mt-3 w-full rounded-full bg-yellow-500 px-5 py-3 font-extrabold text-black transition hover:bg-yellow-400"
            >
              {getPlanButtonText()}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}