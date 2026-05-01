"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackAnalytics } from "@/lib/trackAnalytics";
import { clampScore } from "@/lib/clampScore";
import ScoreBadge from "@/components/ScoreBadge";
import RoseOutHeader from "@/components/RoseOutHeader";

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

const loadingMessages = [
  "Finding hidden gems...",
  "Matching your vibe...",
  "Scanning top-rated spots...",
  "Curating your perfect outing...",
  "Checking the best experiences...",
  "Building something special...",
];

const aiSuggestions = [
  "Plan a fun outing in Queens with dinner and something relaxing after...",
  "Find a classy restaurant near me with a great vibe and easy parking...",
  "I want a birthday outing with food, music, and a memorable experience...",
  "Plan an affordable night out with great food and something fun nearby...",
  "Find a romantic restaurant with an activity close by...",
  "Give me a luxury outing idea for this weekend...",
];

export default function CreatePage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [typedSuggestion, setTypedSuggestion] = useState("");
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
    if (!loading) return;

    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1400);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (input.trim()) return;

    const fullText = aiSuggestions[suggestionIndex];
    let charIndex = 0;

    setTypedSuggestion("");

    const typingTimer = setInterval(() => {
      charIndex += 1;
      setTypedSuggestion(fullText.slice(0, charIndex));

      if (charIndex >= fullText.length) {
        clearInterval(typingTimer);

        setTimeout(() => {
          setSuggestionIndex((prev) => (prev + 1) % aiSuggestions.length);
        }, 1800);
      }
    }, 35);

    return () => clearInterval(typingTimer);
  }, [suggestionIndex, input]);

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

  return (
    <main className="min-h-screen bg-black text-white">
      <RoseOutHeader />

      <section className="relative overflow-hidden border-b border-white/10 pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(225,6,42,0.24),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(225,6,42,0.16),transparent_28%),linear-gradient(180deg,#050505,#000)]" />
        <div className="absolute right-0 top-20 hidden h-[520px] w-[46vw] rounded-bl-[14rem] border-l border-t border-red-500/20 bg-[radial-gradient(circle_at_center,rgba(225,6,42,0.18),transparent_50%)] lg:block" />

        <div className="relative mx-auto max-w-6xl px-5 py-10">
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black text-white/70 transition hover:bg-white hover:text-black"
            >
              ← Home
            </Link>

            <button
              type="button"
              onClick={resetSearch}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black text-white/70 transition hover:bg-white hover:text-black"
            >
              Start New Search
            </button>
          </div>

          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.38em] text-[#e1062a]">
                AI-powered outing planner
              </p>

              <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                What are we
                <br />
                <span className="text-[#e1062a]">planning?</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/55 md:text-lg">
                Type naturally. RoseOut understands your vibe, budget, borough,
                mood, and outing style.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d]/90 p-5 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="relative">
                {!input && (
                 <div className="pointer-events-none absolute left-5 top-4 right-5 z-10 text-sm font-semibold leading-7 text-white">
  <span className="bg-gradient-to-r from-white via-white/80 to-white/50 bg-clip-text text-transparent">
    {typedSuggestion}
  </span>
  <span className="ml-1 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-white/80" />
</div>
                )}

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="relative z-20 min-h-[170px] w-full resize-none rounded-[1.5rem] border border-white/10 bg-black/70 px-5 py-4 text-sm font-semibold leading-7 text-white outline-none placeholder:text-transparent focus:border-[#e1062a]/70"
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold text-white/35">
                <span>Try full sentences. RoseOut will understand.</span>
                <span className="text-[#e1062a]">AI Suggestions</span>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
                  {error}
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className="rounded-2xl bg-[#e1062a] px-7 py-4 text-sm font-black text-white shadow-2xl shadow-red-500/25 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Finding Matches..."
                    : messages.length
                      ? "Send"
                      : "Plan My Outing"}
                </button>

                <button
                  type="button"
                  onClick={requestUserLocation}
                  className={`rounded-2xl px-7 py-4 text-sm font-black transition ${
                    locationSaved
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white hover:text-black"
                  }`}
                >
                  {locationSaved ? "✓ Location Saved" : "Use My Location"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="space-y-5">
          {messages.map((msg, index) => {
            const hasRestaurants = !!msg.restaurants?.length;
            const hasActivities = !!msg.activities?.length;

            return (
              <div
                key={index}
                className={`rounded-[2rem] border p-5 shadow-2xl ${
                  msg.role === "user"
                    ? "border-red-500/30 bg-[#e1062a] text-white shadow-red-500/10"
                    : "border-white/10 bg-[#0d0d0d] text-white shadow-black/30"
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
                    <div className="mb-6">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
                        Results / Recommendations
                      </p>

                      <h2 className="mt-2 text-3xl font-black">
                        Your perfect outing ✨
                      </h2>

                      <p className="mt-1 text-sm font-medium text-white/45">
                        Select your favorites or view full details.
                      </p>
                    </div>

                    {hasRestaurants && (
                      <ResultSection title="Dinner" label="Restaurant Picks">
                        {msg.restaurants?.map((r, restaurantIndex) => {
                          const restaurantId = String(r.id);
                          const isSelected = selectedRestaurant?.id === r.id;
                          const reservationUrl =
                            r.reservation_url || r.reservation_link;
                          const safeScore = clampScore(r.roseout_score);

                          return (
                            <ResultCard
                              key={restaurantId || restaurantIndex}
                              imageUrl={r.image_url}
                              title={r.restaurant_name}
                              eyebrow="Restaurant"
                              address={[r.address, r.city, r.state, r.zip_code]
                                .filter(Boolean)
                                .join(", ")}
                              rating={r.rating}
                              reviewCount={r.review_count}
                              primaryTag={r.primary_tag}
                              tags={r.date_style_tags}
                              distance={r.distance_miles}
                              score={safeScore}
                              selected={isSelected}
                              priority={restaurantIndex === 0}
                              selectLabel={isSelected ? "Selected" : "Select"}
                              onSelect={() =>
                                setSelectedRestaurant(
                                  selectedRestaurant?.id === r.id ? null : r
                                )
                              }
                              detailsHref={`/locations/restaurants/${restaurantId}?from=/create`}
                              onDetails={() => {
                                saveCreateState();
                                trackRestaurantClick(restaurantId);
                              }}
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

                    {hasActivities && (
                      <ResultSection title="Activity" label="Experience Picks">
                        {msg.activities?.map((a, activityIndex) => {
                          const activityId = String(a.id);
                          const isSelected = selectedActivity?.id === a.id;
                          const reservationUrl =
                            a.reservation_url || a.reservation_link;
                          const safeScore = clampScore(a.roseout_score);

                          return (
                            <ResultCard
                              key={activityId || activityIndex}
                              imageUrl={a.image_url}
                              title={a.activity_name}
                              eyebrow={a.activity_type || "Activity"}
                              address={[a.address, a.city, a.state, a.zip_code]
                                .filter(Boolean)
                                .join(", ")}
                              rating={a.rating}
                              reviewCount={a.review_count}
                              primaryTag={a.primary_tag}
                              tags={a.date_style_tags}
                              distance={a.distance_miles}
                              score={safeScore}
                              selected={isSelected}
                              priority={activityIndex === 0}
                              selectLabel={isSelected ? "Selected" : "Select"}
                              onSelect={() =>
                                setSelectedActivity(
                                  selectedActivity?.id === a.id ? null : a
                                )
                              }
                              detailsHref={`/locations/activities/${activityId}?from=/create`}
                              onDetails={() => {
                                saveCreateState();
                                trackActivityClick(activityId);
                              }}
                              websiteUrl={a.website}
                              onWebsite={() => trackActivityClick(activityId)}
                              reservationUrl={reservationUrl}
                              reservationLabel="Book"
                              onReservation={() =>
                                trackActivityClick(activityId)
                              }
                            />
                          );
                        })}
                      </ResultSection>
                    )}
                  </>
                ) : null}

                {msg.role === "assistant" &&
                  !hasRestaurants &&
                  !hasActivities && (
                    <p className="whitespace-pre-wrap text-white/75">
                      {msg.content}
                    </p>
                  )}
              </div>
            );
          })}
        </div>

        {loading && (
          <LuxuryLoading loadingText={loadingMessages[loadingTextIndex]} />
        )}
      </section>

      {(selectedRestaurant || selectedActivity) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/95 p-4 text-white backdrop-blur-2xl">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#e1062a]">
                Building your plan
              </p>

              <p className="mt-1 text-sm font-black text-white">
                {selectedPlanText}
              </p>
            </div>

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
              className="rounded-2xl bg-[#e1062a] px-7 py-3 text-sm font-black text-white shadow-lg shadow-red-500/25 transition hover:bg-red-500"
            >
              {getPlanButtonText()}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function ResultSection({
  title,
  label,
  children,
}: {
  title: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-[0.25em] text-white/40">
          {title}
        </h2>

        <span className="rounded-full bg-[#e1062a] px-3 py-1 text-xs font-black text-white">
          {label}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">{children}</div>
    </div>
  );
}

function ResultCard({
  imageUrl,
  title,
  eyebrow,
  address,
  rating,
  reviewCount,
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
  imageUrl?: string;
  title: string;
  eyebrow: string;
  address: string;
  rating?: number | null;
  reviewCount?: number | null;
  primaryTag?: string | null;
  tags?: string[];
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
  return (
    <div
      className={`group overflow-hidden rounded-[2rem] border bg-[#111] shadow-2xl shadow-black/30 transition duration-300 hover:-translate-y-1 ${
        selected
          ? "border-red-500 ring-2 ring-red-500/50"
          : "border-white/10 hover:border-red-500/50"
      }`}
    >
      <div className="relative">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={900}
            height={520}
            className="h-64 w-full object-cover transition duration-700 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="flex h-64 items-center justify-center bg-neutral-900 text-neutral-500">
            No image available
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        <div className="absolute left-4 top-4 origin-top-left scale-75 rounded-[1rem] bg-white/95 p-2 text-black shadow-xl backdrop-blur">
          <ScoreBadge score={score} />
        </div>

        {distance !== null && distance !== undefined && (
          <div className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1 text-xs font-black text-white backdrop-blur">
            {distance} mi away
          </div>
        )}

        {rating && (
          <div className="absolute bottom-4 right-4 rounded-full bg-white px-3 py-1 text-sm font-black text-black shadow-lg">
            ⭐ {rating}
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e1062a]">
          {eyebrow}
        </p>

        <h3 className="mt-2 line-clamp-1 text-2xl font-black tracking-tight text-white">
          {title}
        </h3>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/50">
          {address}
        </p>

        {reviewCount ? (
          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-white/35">
            {reviewCount} reviews
          </p>
        ) : null}

        {primaryTag && (
          <p className="mt-4 text-sm font-black text-white">
            ✨ {primaryTag}
          </p>
        )}

        {tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/55"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSelect}
            className={`rounded-full px-5 py-2.5 text-sm font-black transition ${
              selected
                ? "bg-[#e1062a] text-white"
                : "border border-white/15 text-white hover:bg-white hover:text-black"
            }`}
          >
            {selectLabel}
          </button>

          <Link
            href={detailsHref}
            onClick={onDetails}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-black transition hover:bg-red-100"
          >
            View Details
          </Link>

          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onWebsite}
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-black text-white transition hover:bg-white hover:text-black"
            >
              Website
            </a>
          )}

          {reservationUrl && (
            <a
              href={reservationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onReservation}
              className="rounded-full border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-black text-red-100 transition hover:bg-[#e1062a] hover:text-white"
            >
              {reservationLabel || "Book"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function LuxuryLoading({ loadingText }: { loadingText: string }) {
  return (
    <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-5 text-white shadow-2xl shadow-black/40">
      <div className="mb-5 text-center">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e1062a]">
          RoseOut is searching
        </p>

        <h2 className="mt-2 min-h-[32px] text-2xl font-black transition-all duration-500">
          {loadingText}
        </h2>

        <div className="mt-4 flex justify-center gap-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#e1062a]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#e1062a] [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#e1062a] [animation-delay:300ms]" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black shadow-xl"
          >
            <div className="relative h-64 overflow-hidden bg-neutral-900">
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black blur-sm" />
              <div className="absolute inset-0 -translate-x-full animate-[roseoutShimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>

            <div className="p-5">
              <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
              <div className="mt-4 h-8 w-64 animate-pulse rounded-full bg-white/10" />
              <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-white/10" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-white/10" />

              <div className="mt-6 flex gap-3">
                <div className="h-11 w-28 animate-pulse rounded-full border border-white/10" />
                <div className="h-11 w-36 animate-pulse rounded-full bg-red-500/20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes roseoutShimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}