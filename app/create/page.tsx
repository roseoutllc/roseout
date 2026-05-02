"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackAnalytics } from "@/lib/trackAnalytics";
import { clampScore } from "@/lib/clampScore";
import RoseOutHeader from "@/components/RoseOutHeader";

type RestaurantCard = {
  id: string;
  restaurant_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  cuisine?: string | null;
  atmosphere?: string | null;
  price_range?: string | null;
  roseout_score: number;
  reservation_link?: string;
  reservation_url?: string;
  website?: string;
  image_url?: string;
  rating?: number | null;
  review_count?: number | null;
  review_score?: number | null;
  review_keywords?: string[] | null;
  review_snippet?: string | null;
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
  review_score?: number | null;
  review_keywords?: string[] | null;
  review_snippet?: string | null;
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
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const followUpRef = useRef<HTMLTextAreaElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const restoredStateRef = useRef(false);

  const [selectedRestaurant, setSelectedRestaurant] =
    useState<RestaurantCard | null>(null);

  const [selectedActivity, setSelectedActivity] =
    useState<ActivityCard | null>(null);

  const hasSearched = messages.length > 0;

  const latestAssistant = [...messages]
    .reverse()
    .find((msg) => msg.role === "assistant");

  const suggestedFollowUps = getSuggestedFollowUps(latestAssistant);

  const saveCreateState = useCallback(() => {
    if (typeof window === "undefined") return;

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        input,
        messages,
        selectedRestaurant,
        selectedActivity,
        scrollY: window.scrollY,
        savedAt: Date.now(),
      })
    );
  }, [input, messages, selectedRestaurant, selectedActivity]);

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

  const resetSearch = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("roseout_plan");

    setInput("");
    setMessages([]);
    setSelectedRestaurant(null);
    setSelectedActivity(null);
    setError("");

    setTimeout(() => inputRef.current?.focus(), 100);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setLocationSaved(!!getSavedUserLocation());

    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        setInput(parsed.input || "");
        setMessages(Array.isArray(parsed.messages) ? parsed.messages : []);
        setSelectedRestaurant(parsed.selectedRestaurant || null);
        setSelectedActivity(parsed.selectedActivity || null);
        setError("");

        restoredStateRef.current = true;

        setTimeout(() => {
          window.scrollTo({
            top: Number(parsed.scrollY || 0),
            behavior: "auto",
          });
        }, 250);

        return;
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }

    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    if (!restoredStateRef.current && messages.length === 0) return;

    saveCreateState();
  }, [messages, input, selectedRestaurant, selectedActivity, saveCreateState]);

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

  useEffect(() => {
    if (restoredStateRef.current) return;
    if (!hasSearched) return;

    const latestMessage = messages[messages.length - 1];

    if (latestMessage?.role !== "user") return;

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
  }, [messages.length, hasSearched, messages]);

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

  const sendMessage = async (overrideText?: string) => {
    if (loading) return;

    restoredStateRef.current = false;

    const messageText = overrideText || input;

    if (!messageText.trim()) {
      setError("Please enter what you’re looking for.");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: messageText,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);
    setSelectedRestaurant(null);
    setSelectedActivity(null);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

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
    } catch {
      setError("Could not create response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
    <main className="min-h-screen w-full overflow-x-hidden bg-black text-white">
      <RoseOutHeader />

      <section
        className={`relative overflow-hidden border-b border-white/10 transition-all duration-500 ${
          hasSearched
            ? "pt-8 pb-3 sm:pt-24 sm:pb-4"
            : "pt-8 pb-10 sm:pt-28 sm:pb-16"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(225,6,42,0.24),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(225,6,42,0.16),transparent_28%),linear-gradient(180deg,#050505,#000)]" />

        {!hasSearched && (
          <div className="absolute right-0 top-20 hidden h-[520px] w-[46vw] rounded-bl-[14rem] border-l border-t border-red-500/20 bg-[radial-gradient(circle_at_center,rgba(225,6,42,0.18),transparent_50%)] lg:block" />
        )}

        <div className="relative mx-auto w-full max-w-6xl px-4 py-2 sm:px-5 sm:py-4">
          {!hasSearched && (
            <div className="grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div className="max-w-full">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#e1062a] sm:tracking-[0.38em]">
                  AI-powered outing planner
                </p>

                <h1 className="mt-5 max-w-full break-words text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                  What are we
                  <br />
                  <span className="text-[#e1062a]">planning?</span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-white/55 md:text-lg">
                  Type naturally. RoseOut understands your vibe, budget,
                  borough, mood, and outing style.
                </p>
              </div>

              <div className="w-full max-w-full rounded-[2rem] border border-white/10 bg-[#0d0d0d]/95 p-5 shadow-2xl shadow-black/40 backdrop-blur">
                <div className="relative">
                  {!input && (
                    <div className="pointer-events-none absolute left-5 right-5 top-4 z-10 text-sm font-semibold leading-7 text-white">
                      <span className="bg-gradient-to-r from-white via-white/90 to-white/65 bg-clip-text text-transparent">
                        {typedSuggestion}
                      </span>
                      <span className="ml-1 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-white/80" />
                    </div>
                  )}

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    rows={5}
                    className="relative z-20 min-h-[170px] w-full max-w-full resize-none rounded-[1.5rem] border border-white/10 bg-black/70 px-5 py-4 text-sm font-semibold leading-7 text-white outline-none placeholder:text-transparent focus:border-[#e1062a]/70"
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
                    onClick={() => sendMessage()}
                    disabled={loading}
                    className="rounded-2xl bg-[#e1062a] px-7 py-4 text-sm font-black text-white shadow-2xl shadow-red-500/25 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Finding Matches..." : "Plan My Outing"}
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
          )}
        </div>
      </section>

      <section
        ref={resultsRef}
        className="mx-auto w-full max-w-6xl scroll-mt-40 overflow-x-hidden px-4 py-8 sm:px-5"
      >
        {loading ? (
          <LuxuryLoading loadingText={loadingMessages[loadingTextIndex]} />
        ) : (
          <div className="w-full max-w-full space-y-5">
            {messages.map((msg, index) => {
              const hasRestaurants = !!msg.restaurants?.length;
              const hasActivities = !!msg.activities?.length;

              return (
                <div
                  key={index}
                  className={`max-w-full border shadow-2xl ${
                    msg.role === "user"
                      ? "mx-auto max-w-4xl animate-[resultFadeIn_450ms_ease-out_both] rounded-[1.5rem] border-red-500/30 bg-[#e1062a] p-4 text-white shadow-red-500/10 sm:rounded-[2rem] sm:p-5"
                      : "animate-[resultFadeIn_550ms_ease-out_both] border-white/10 bg-[#0d0d0d] text-white shadow-black/30"
                  }`}
                >
                  {msg.role === "user" && (
                    <p className="whitespace-pre-wrap break-words font-black">
                      {msg.content}
                    </p>
                  )}

                  {msg.role === "assistant" &&
                  (hasRestaurants || hasActivities) ? (
                    <>
                      <div className="mb-6 max-w-full">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e1062a] sm:tracking-[0.3em]">
                            Results / Recommendations
                          </p>

                          <button
                            type="button"
                            onClick={resetSearch}
                            className="w-fit rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black text-white/70 transition hover:bg-white hover:text-black"
                          >
                            Start New Search
                          </button>
                        </div>

                        <h2 className="mt-2 max-w-full break-words text-3xl font-black leading-tight sm:text-5xl">
                          Your perfect outing ✨
                        </h2>

                        <p className="mt-2 break-words text-sm font-medium text-white/45">
                          Select your favorites or view full details.
                        </p>
                      </div>

                      {hasRestaurants && (
                        <ResultSection>
                          {msg.restaurants?.map((r, restaurantIndex) => {
                            const restaurantId = String(r.id);
                            const isSelected = selectedRestaurant?.id === r.id;
                            const reservationUrl =
                              r.reservation_url || r.reservation_link;
                            const safeScore = clampScore(r.roseout_score);

                            return (
                              <ResultCard
                                key={restaurantId || restaurantIndex}
                                index={restaurantIndex}
                                imageUrl={r.image_url}
                                title={r.restaurant_name}
                                eyebrow="Restaurant"
                                address={[
                                  r.address,
                                  r.city,
                                  r.state,
                                  r.zip_code,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                                rating={r.rating}
                                reviewCount={r.review_count}
                                reviewScore={r.review_score}
                                reviewKeywords={r.review_keywords}
                                reviewSnippet={r.review_snippet}
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
                                onBeforeNavigate={saveCreateState}
                                onDetails={() =>
                                  trackRestaurantClick(restaurantId)
                                }
                                websiteUrl={r.website}
                                onWebsite={() =>
                                  trackRestaurantClick(restaurantId)
                                }
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
                        <ResultSection>
                          {msg.activities?.map((a, activityIndex) => {
                            const activityId = String(a.id);
                            const isSelected = selectedActivity?.id === a.id;
                            const reservationUrl =
                              a.reservation_url || a.reservation_link;
                            const safeScore = clampScore(a.roseout_score);

                            return (
                              <ResultCard
                                key={activityId || activityIndex}
                                index={activityIndex}
                                imageUrl={a.image_url}
                                title={a.activity_name}
                                eyebrow={a.activity_type || "Activity"}
                                address={[
                                  a.address,
                                  a.city,
                                  a.state,
                                  a.zip_code,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                                rating={a.rating}
                                reviewCount={a.review_count}
                                reviewScore={a.review_score}
                                reviewKeywords={a.review_keywords}
                                reviewSnippet={a.review_snippet}
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
                                onBeforeNavigate={saveCreateState}
                                onDetails={() =>
                                  trackActivityClick(activityId)
                                }
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
                      <p className="whitespace-pre-wrap break-words text-white/75">
                        {msg.content}
                      </p>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {hasSearched && !loading && (
        <section className="mx-auto w-full max-w-4xl overflow-x-hidden px-4 pb-28 sm:px-5">
          <div className="w-full max-w-full rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl shadow-black/40">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
              Ask a follow-up
            </p>

            {suggestedFollowUps.length > 0 && (
              <div className="mb-4 flex max-w-full flex-wrap gap-2">
                {suggestedFollowUps.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    disabled={loading}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/65 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-white disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className="relative max-w-full">
              {!input && (
                <div className="pointer-events-none absolute left-5 right-5 top-4 z-10 text-sm font-semibold leading-7 text-white">
                  <span className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                    Refine your plan, change location, budget, or vibe...
                  </span>
                  <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-white/80" />
                </div>
              )}

              <textarea
                ref={followUpRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                rows={2}
                className="relative z-20 min-h-[76px] w-full max-w-full resize-none rounded-[1.5rem] border border-white/10 bg-black/70 px-5 py-4 text-sm font-semibold leading-7 text-white outline-none focus:border-[#e1062a]/70"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
                {error}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold text-white/40">
                Press Enter to send • Shift + Enter for new line
              </p>

              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className="rounded-full bg-[#e1062a] px-6 py-2 text-sm font-black text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      )}

      {(selectedRestaurant || selectedActivity) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/95 p-4 text-white backdrop-blur-2xl">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#e1062a]">
                Building your plan
              </p>

              <p className="mt-1 break-words text-sm font-black text-white">
                {selectedPlanText}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                saveCreateState();

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

      <style jsx global>{`
        @keyframes resultFadeIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes cardReveal {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
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

function getSuggestedFollowUps(message?: Message) {
  const restaurants = message?.restaurants || [];
  const activities = message?.activities || [];

  const cuisine = restaurants.find((r) => r.cuisine)?.cuisine;
  const restaurantTags = restaurants.flatMap((r) => r.date_style_tags || []);
  const activityTags = activities.flatMap((a) => a.date_style_tags || []);
  const allTags = [...restaurantTags, ...activityTags].join(" ").toLowerCase();

  const hasRestaurants = restaurants.length > 0;
  const hasActivities = activities.length > 0;

  const suggestions: string[] = [];

  suggestions.push("Make it cheaper");
  suggestions.push("More romantic");

  if (cuisine) suggestions.push(`More ${cuisine} options`);

  suggestions.push("Add rooftop vibes");

  if (
    allTags.includes("family") ||
    allTags.includes("kid") ||
    activities.some((a) => a.group_friendly)
  ) {
    suggestions.push("Make it kid-friendly");
  }

  if (
    allTags.includes("bar") ||
    allTags.includes("drinks") ||
    allTags.includes("music") ||
    allTags.includes("nightlife")
  ) {
    suggestions.push("Add nightlife");
  } else if (hasRestaurants) {
    suggestions.push("Add drinks after");
  }

  if (allTags.includes("hookah") || allTags.includes("shisha")) {
    suggestions.push("More hookah lounges");
  }

  if (allTags.includes("cigar")) {
    suggestions.push("More cigar-friendly spots");
  }

  if (hasActivities) suggestions.push("Make the activity more fun");

  suggestions.push("Change to Brooklyn");
  suggestions.push("Show me something more upscale");

  return Array.from(new Set(suggestions)).slice(0, 8);
}

function ResultSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-10 max-w-full overflow-x-hidden">
      <div className="grid w-full max-w-full gap-5 lg:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function ResultCard({
  index,
  imageUrl,
  title,
  eyebrow,
  address,
  rating,
  reviewCount,
  reviewScore,
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
  onBeforeNavigate,
  onDetails,
  websiteUrl,
  onWebsite,
  reservationUrl,
  reservationLabel,
  onReservation,
}: {
  index: number;
  imageUrl?: string;
  title: string;
  eyebrow: string;
  address: string;
  rating?: number | null;
  reviewCount?: number | null;
  reviewScore?: number | null;
  reviewKeywords?: string[] | null;
  reviewSnippet?: string | null;
  primaryTag?: string | null;
  tags?: string[];
  distance?: number | null;
  score: number;
  selected: boolean;
  priority: boolean;
  selectLabel: string;
  onSelect: () => void;
  detailsHref: string;
  onBeforeNavigate?: () => void;
  onDetails: () => void;
  websiteUrl?: string;
  onWebsite?: () => void;
  reservationUrl?: string;
  reservationLabel?: string;
  onReservation?: () => void;
}) {
  const openDetails = () => {
    onBeforeNavigate?.();
    onDetails();
    window.location.href = detailsHref;
  };

  const safeScore = clampScore(score);
  const cleanReviewKeywords = Array.isArray(reviewKeywords)
    ? reviewKeywords.filter(Boolean).slice(0, 4)
    : [];

  const combinedText = [
    title,
    eyebrow,
    primaryTag,
    reviewSnippet,
    ...(tags || []),
    ...cleanReviewKeywords,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const premiumBadges: string[] = [];

  if (combinedText.includes("hookah") || combinedText.includes("shisha")) {
    premiumBadges.push("🌬 Hookah");
  }

  if (
    combinedText.includes("cigar") ||
    combinedText.includes("cigar bar") ||
    combinedText.includes("cigar lounge") ||
    combinedText.includes("cigar friendly")
  ) {
    premiumBadges.push("🥃 Cigar Friendly");
  }

  if (
    combinedText.includes("restaurant") ||
    combinedText.includes("dining") ||
    combinedText.includes("dinner") ||
    combinedText.includes("food")
  ) {
    premiumBadges.push("🍽 Full Dining");
  }

  if (
    combinedText.includes("lounge") ||
    combinedText.includes("music") ||
    combinedText.includes("dj") ||
    combinedText.includes("nightlife")
  ) {
    premiumBadges.push("🎶 Lounge Vibe");
  }

  if (combinedText.includes("romantic") || combinedText.includes("intimate")) {
    premiumBadges.push("❤️ Date Night");
  }

  if (combinedText.includes("upscale") || combinedText.includes("classy")) {
    premiumBadges.push("✨ Upscale");
  }

  const uniquePremiumBadges = Array.from(new Set(premiumBadges)).slice(0, 5);

  const isLovedByGuests =
    typeof reviewScore === "number" && reviewScore >= 85 && Boolean(reviewCount);

  const isStrongMatch = safeScore >= 80;
  const isTopPick = index === 0 && safeScore >= 70;

  const scoreRing = `conic-gradient(#e1062a ${Math.round(
    safeScore
  )}%, rgba(255,255,255,0.13) 0)`;

  const whyPicked =
    cleanReviewKeywords.length > 0
      ? `RoseOut matched this because guests mention ${cleanReviewKeywords
          .slice(0, 3)
          .join(", ")}.`
      : primaryTag
      ? `RoseOut matched this for its ${primaryTag.toLowerCase()} vibe.`
      : "RoseOut matched this based on your outing request, location signals, and overall fit.";

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("a, button")) return;
        openDetails();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") openDetails();
      }}
      className={`group relative w-full max-w-full cursor-pointer overflow-hidden rounded-[2.25rem] border bg-[#0d0d0d] shadow-2xl shadow-black/40 transition duration-500 hover:-translate-y-1 hover:border-[#e1062a]/70 hover:bg-[#121212] hover:shadow-red-500/10 ${
        selected
          ? "border-red-500 ring-2 ring-red-500/50"
          : "border-white/10"
      }`}
      style={{
        animation: `cardReveal 560ms ease-out ${index * 120}ms both`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-600/10 blur-3xl" />
      </div>

      <div className="relative h-64 w-full max-w-full overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={900}
            height={520}
            className="h-full w-full max-w-full object-cover object-center transition-transform duration-700 ease-out will-change-transform group-hover:scale-110"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full max-w-full items-center justify-center bg-neutral-900 text-neutral-500">
            No image available
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(225,6,42,0.26),transparent_32%)] opacity-80" />

        <div className="absolute left-4 top-4 flex items-center gap-3 rounded-2xl border border-red-500/35 bg-black/80 px-4 py-3 text-white shadow-xl shadow-red-500/10 backdrop-blur-xl">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full p-[3px] shadow-lg shadow-red-950/40"
            style={{ background: scoreRing }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-sm font-black text-white">
              {Math.round(safeScore)}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
              RoseOut Score
            </p>
            <p className="text-sm font-black text-white">
              {Math.round(safeScore)}/100
            </p>
            <p className="mt-1 w-fit rounded-full bg-[#e1062a] px-2 py-0.5 text-[10px] font-black text-white">
              Match
            </p>
          </div>
        </div>

        <div className="absolute right-4 top-4 flex max-w-[58%] flex-col items-end gap-2">
          {isTopPick && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black shadow-lg">
              🏆 Top Pick
            </span>
          )}

          {isLovedByGuests && (
            <span className="rounded-full bg-[#e1062a] px-3 py-1 text-xs font-black text-white shadow-lg shadow-red-950/30">
              🌹 Loved by Guests
            </span>
          )}

          {isStrongMatch && (
            <span className="rounded-full border border-white/20 bg-black/70 px-3 py-1 text-xs font-black text-white backdrop-blur">
              🔥 Strong Match
            </span>
          )}
        </div>

        {distance !== null && distance !== undefined && (
          <div className="absolute bottom-4 left-4 rounded-full bg-black/75 px-3 py-1 text-xs font-black text-white backdrop-blur">
            {distance} mi away
          </div>
        )}

        {rating && (
          <div className="absolute bottom-4 right-4 rounded-full bg-white px-3 py-1 text-sm font-black text-black shadow-lg">
            🌹 {rating}
          </div>
        )}
      </div>

      <div className="relative max-w-full p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="break-words text-xs font-black uppercase tracking-[0.22em] text-[#e1062a]">
            {eyebrow}
          </p>

          {reviewCount ? (
            <p className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white/45">
              🌸 {reviewCount} review{reviewCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        <Link
          href={detailsHref}
          onClick={() => {
            onBeforeNavigate?.();
            onDetails();
          }}
          className="group/title block"
        >
          <h3 className="mt-2 break-words text-2xl font-black tracking-tight text-white transition duration-200 group-hover/title:text-[#e1062a]">
            {title}
          </h3>
          <span className="mt-1 block h-[2px] w-0 bg-[#e1062a] transition-all duration-300 group-hover/title:w-full" />
        </Link>

        <p className="mt-3 break-words text-sm leading-6 text-white/50">
          {address}
        </p>

        {uniquePremiumBadges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {uniquePremiumBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-black text-red-100"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {cleanReviewKeywords.length > 0 && (
          <div className="mt-4 rounded-[1.35rem] border border-red-500/15 bg-gradient-to-br from-red-500/[0.1] via-red-500/[0.045] to-white/[0.025] p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-red-200/70">
              Review Signals
            </p>

            <div className="flex flex-wrap gap-2">
              {cleanReviewKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-red-500/20 bg-black/35 px-3 py-1 text-xs font-black text-red-100"
                >
                  {keyword}
                </span>
              ))}
            </div>

            {reviewSnippet && (
              <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-white/65">
                “{reviewSnippet}”
              </p>
            )}
          </div>
        )}

        <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
            Why RoseOut picked this
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/65">
            {whyPicked}
          </p>
        </div>

        {primaryTag && (
          <p className="mt-4 break-words text-sm font-black text-white">
            ✨ {primaryTag}
          </p>
        )}

        {tags?.length ? (
          <div className="mt-4 flex max-w-full flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="max-w-full break-words rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/55"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 grid max-w-full gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSelect}
            className={`rounded-full px-5 py-3 text-sm font-black transition ${
              selected
                ? "bg-[#e1062a] text-white shadow-lg shadow-red-950/30"
                : "border border-white/15 text-white hover:bg-white hover:text-black"
            }`}
          >
            {selectLabel}
          </button>

          <Link
            href={detailsHref}
            onClick={() => {
              onBeforeNavigate?.();
              onDetails();
            }}
            className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-black transition hover:bg-red-100"
          >
            View Details
          </Link>

          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onWebsite}
              className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white hover:text-black"
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
              className="rounded-full border border-red-500/40 bg-red-500/10 px-5 py-3 text-center text-sm font-black text-red-100 transition hover:bg-[#e1062a] hover:text-white"
            >
              {reservationLabel || "Book"}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function LuxuryLoading({ loadingText }: { loadingText: string }) {
  return (
    <div className="mt-6 max-w-full animate-fadeIn space-y-10 overflow-x-hidden">
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e1062a]">
          RoseOut is searching
        </p>

        <h2 className="mt-2 break-words text-2xl font-black">{loadingText}</h2>

        <p className="mt-2 text-sm font-semibold text-white/40">
          Building your recommendations...
        </p>
      </div>

      <div className="grid w-full max-w-full gap-5 lg:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <SkeletonCard key={index} index={index} />
        ))}
      </div>
    </div>
  );
}

function SkeletonCard({ index }: { index: number }) {
  const delay = `${index * 180}ms`;

  return (
    <div
      className="group w-full max-w-full overflow-hidden rounded-[2rem] border border-white/5 bg-[#0b0b0b] shadow-2xl shadow-black/30"
      style={{
        animation: `skeletonReveal 520ms ease-out ${delay} both`,
      }}
    >
      <div className="relative h-64 w-full max-w-full overflow-hidden bg-[#080808]">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-[#050505] blur-sm" />

        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/[0.045] to-transparent" />

        <div className="absolute left-4 top-4 rounded-[1rem] bg-white/10 p-2">
          <div className="h-12 w-12 rounded-xl bg-black/30" />
        </div>

        <div className="absolute bottom-4 left-4 h-6 w-24 rounded-full bg-black/45" />

        <div className="absolute bottom-4 right-4 h-7 w-16 rounded-full bg-white/10" />
      </div>

      <div className="max-w-full space-y-3 p-5">
        <div className="h-3 w-24 animate-pulse rounded-full bg-red-500/15" />

        <div
          className={`mt-3 h-7 animate-pulse rounded-full bg-white/[0.055] ${
            index % 2 === 0 ? "w-4/5" : "w-2/3"
          }`}
        />

        <div className="mt-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded-full bg-white/[0.05]" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/[0.045]" />
        </div>

        <div className="mt-3 h-3 w-28 animate-pulse rounded-full bg-white/[0.045]" />

        <div className="mt-4 h-5 w-48 max-w-full animate-pulse rounded-full bg-white/[0.05]" />

        <div className="mt-4 flex max-w-full flex-wrap gap-2">
          <div className="h-7 w-24 animate-pulse rounded-full bg-white/[0.045]" />
          <div className="h-7 w-20 animate-pulse rounded-full bg-white/[0.04]" />
          <div className="h-7 w-28 animate-pulse rounded-full bg-white/[0.045]" />
        </div>

        <div className="mt-5 flex max-w-full flex-wrap gap-3">
          <div className="h-10 w-20 animate-pulse rounded-full border border-white/5 bg-white/[0.035]" />
          <div className="h-10 w-28 animate-pulse rounded-full bg-white/[0.08]" />
          <div className="h-10 w-24 animate-pulse rounded-full border border-red-500/10 bg-red-500/[0.06]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes skeletonReveal {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}