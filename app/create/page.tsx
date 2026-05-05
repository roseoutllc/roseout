"use client";

import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import RoseOutHeader from "@/components/RoseOutHeader";
import { trackAnalytics } from "@/lib/trackAnalytics";
import { clampScore } from "@/lib/clampScore";

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
  "Plan an affordable outing with great food and something fun nearby...",
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
    localStorage.removeItem("roseout-search");
    localStorage.removeItem("roseout-results");
    sessionStorage.removeItem("roseout-search");
    sessionStorage.removeItem("roseout-results");

    setInput("");
    setMessages([]);
    setSelectedRestaurant(null);
    setSelectedActivity(null);
    setError("");
    restoredStateRef.current = false;

    setTimeout(() => inputRef.current?.focus(), 100);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    document.title = "Create Your Outing | RoseOut";

    setLocationSaved(!!getSavedUserLocation());

    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("roseout_plan");
    localStorage.removeItem("roseout-search");
    localStorage.removeItem("roseout-results");
    sessionStorage.removeItem("roseout-search");
    sessionStorage.removeItem("roseout-results");

    setInput("");
    setMessages([]);
    setSelectedRestaurant(null);
    setSelectedActivity(null);
    setError("");
    restoredStateRef.current = false;

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
      const savedLocation = getSavedUserLocation();

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: messageText,
          messages: nextMessages.slice(-4),
          userLocation: savedLocation,
          lat: savedLocation?.latitude,
          lng: savedLocation?.longitude,
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
    if (selectedRestaurant) return "View Restaurant Plan";
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
    <main
      className={`min-h-screen w-full overflow-x-hidden bg-[#050505] text-white ${
        selectedRestaurant || selectedActivity ? "pb-32 md:pb-0" : ""
      }`}
    >
      <RoseOutHeader />

      <section
        className={`relative overflow-hidden border-b border-white/10 transition-all duration-500 ${
          hasSearched
            ? "pt-24 pb-5 sm:pt-28 lg:pt-32"
            : "pt-24 pb-10 sm:pt-32 lg:pt-40 lg:pb-24"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(225,6,42,0.22),transparent_32%),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.08),transparent_26%),linear-gradient(180deg,#090909,#050505_55%,#000)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
          {!hasSearched ? (
            <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
              <div>
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#e1062a] sm:text-xs sm:tracking-[0.25em]">
                  RoseOut Concierge
                </div>

                <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                  Plan the outing.
                  <span className="block text-[#e1062a]">Keep the vibe.</span>
                </h1>

                <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-white/55 sm:mt-6 sm:text-base sm:leading-8 md:text-lg">
                  Tell RoseOut what you want. We’ll match restaurants,
                  activities, celebration ideas, distance, budget, and local
                  experiences into one curated outing.
                </p>

                <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3">
                  <MiniStat value="AI" label="Vibe matching" />
                  <MiniStat value="98%" label="Smart match rating" />
                  <MiniStat value="Near You" label="Experience finder" />
                </div>
              </div>

              <SearchPanel
                input={input}
                setInput={setInput}
                inputRef={inputRef}
                typedSuggestion={typedSuggestion}
                loading={loading}
                locationSaved={locationSaved}
                error={error}
                onSend={() => sendMessage()}
                onLocation={requestUserLocation}
                onKeyDown={handleInputKeyDown}
              />
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-black/65 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:rounded-[2rem]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <button
                  type="button"
                  onClick={resetSearch}
                  className="w-full rounded-full border border-white/15 bg-white/[0.06] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/65 transition hover:bg-white hover:text-black sm:w-fit sm:py-2"
                >
                  New Search
                </button>

                <div className="relative flex-1">
                  {!input && (
                    <div className="pointer-events-none absolute left-5 right-5 top-4 z-10 text-sm font-bold leading-6 text-white/35 sm:top-1/2 sm:-translate-y-1/2 sm:truncate">
                      Ask for a different vibe, budget, borough, or activity...
                    </div>
                  )}

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    rows={2}
                    className="relative z-20 min-h-[64px] w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#e1062a] sm:rounded-full"
                  />
                </div>

                <button
                  onClick={() => sendMessage()}
                  disabled={loading}
                  className="w-full rounded-full bg-[#e1062a] px-7 py-4 text-sm font-black text-white shadow-2xl shadow-red-500/25 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
                >
                  {loading ? "Searching..." : "Update Results"}
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section
        ref={resultsRef}
        className="mx-auto w-full max-w-7xl scroll-mt-32 overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8"
      >
        {loading ? (
          <LuxuryLoading loadingText={loadingMessages[loadingTextIndex]} />
        ) : (
          <div className="w-full space-y-5 sm:space-y-6">
            {messages.map((msg, index) => {
              const hasRestaurants = !!msg.restaurants?.length;
              const hasActivities = !!msg.activities?.length;

              return (
                <div key={index}>
                  {msg.role === "user" && (
                    <div className="mx-auto max-w-4xl animate-[resultFadeIn_450ms_ease-out_both] rounded-[1.25rem] border border-red-500/25 bg-[#e1062a] p-4 text-white shadow-2xl shadow-red-500/10 sm:rounded-[1.5rem]">
                      <p className="whitespace-pre-wrap break-words text-sm font-black sm:text-base">
                        {msg.content}
                      </p>
                    </div>
                  )}

                  {msg.role === "assistant" &&
                  (hasRestaurants || hasActivities) ? (
                    <div className="animate-[resultFadeIn_550ms_ease-out_both] rounded-[1.5rem] border border-white/10 bg-[#0b0b0b] p-4 shadow-2xl shadow-black/40 sm:rounded-[2rem] sm:p-6">
                      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#e1062a] sm:text-xs sm:tracking-[0.32em]">
                            Curated Results
                          </p>

                          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                            RoseOut found your vibe.
                          </h2>

                          <p className="mt-2 text-sm font-semibold leading-6 text-white/45">
                            Choose your favorites, reserve, or view full
                            details.
                          </p>
                        </div>
                      </div>

                      {hasRestaurants && (
                        <ResultSection
                          title="Restaurant Picks"
                          subtitle="Food spots matched to your request"
                        >
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
                                eyebrow={r.cuisine || "Restaurant"}
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
                        <ResultSection
                          title="Experience Picks"
                          subtitle="Activities and places to continue the outing"
                        >
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
                                onDetails={() => trackActivityClick(activityId)}
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
                    </div>
                  ) : null}

                  {msg.role === "assistant" &&
                    !hasRestaurants &&
                    !hasActivities && (
                      <div className="rounded-[1.5rem] border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl shadow-black/40 sm:rounded-[2rem] sm:p-6">
                        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white/75 sm:text-base">
                          {msg.content}
                        </p>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {hasSearched && !loading && (
        <section className="mx-auto w-full max-w-5xl overflow-x-hidden px-4 pb-36 sm:px-6 md:pb-32">
          <div className="rounded-[1.5rem] border border-white/10 bg-[#0b0b0b] p-4 shadow-2xl shadow-black/40 sm:rounded-[2rem] sm:p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-[#e1062a] sm:text-xs sm:tracking-[0.3em]">
              Refine Your Outing
            </p>

            {suggestedFollowUps.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {suggestedFollowUps.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    disabled={loading}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] font-black text-white/65 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-white disabled:opacity-50 sm:px-4 sm:text-xs"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className="relative">
              {!input && (
                <div className="pointer-events-none absolute left-5 right-5 top-4 z-10 text-sm font-semibold leading-7 text-white/35">
                  Refine your plan, change location, budget, or vibe...
                </div>
              )}

              <textarea
                ref={followUpRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                rows={2}
                className="relative z-20 min-h-[84px] w-full resize-none rounded-[1.25rem] border border-white/10 bg-black/70 px-5 py-4 text-sm font-semibold leading-7 text-white outline-none focus:border-[#e1062a]/70 sm:rounded-[1.5rem]"
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
                className="w-full rounded-full bg-[#e1062a] px-6 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:opacity-50 sm:w-auto"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      )}

      {(selectedRestaurant || selectedActivity) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-white backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#e1062a] sm:text-xs">
                Building your plan
              </p>

              <p className="mt-1 line-clamp-2 break-words text-sm font-black text-white">
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
              className="w-full rounded-2xl bg-[#e1062a] px-7 py-3 text-sm font-black text-white shadow-lg shadow-red-500/25 transition hover:bg-red-500 md:w-auto"
            >
              {getPlanButtonText()}
            </button>
          </div>
        </div>
      )}

      <RoseOutFooter />

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

function SearchPanel({
  input,
  setInput,
  inputRef,
  typedSuggestion,
  loading,
  locationSaved,
  error,
  onSend,
  onLocation,
  onKeyDown,
}: {
  input: string;
  setInput: (value: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  typedSuggestion: string;
  loading: boolean;
  locationSaved: boolean;
  error: string;
  onSend: () => void;
  onLocation: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[#0b0b0b]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl sm:rounded-[2.5rem] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35 sm:text-xs sm:tracking-[0.25em]">
            Start with a vibe
          </p>
          <h2 className="mt-1 text-xl font-black sm:text-2xl">
            What are we planning?
          </h2>
        </div>

        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-black">
          Curated picks
        </span>
      </div>

      <div className="relative">
        {!input && (
          <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 text-sm font-semibold leading-7 text-white sm:left-5 sm:right-5">
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
          onKeyDown={onKeyDown}
          rows={5}
          className="relative z-20 min-h-[160px] w-full resize-none rounded-[1.35rem] border border-white/10 bg-black/80 px-4 py-4 text-sm font-semibold leading-7 text-white outline-none placeholder:text-transparent focus:border-[#e1062a]/70 sm:min-h-[175px] sm:rounded-[1.75rem] sm:px-5"
        />
      </div>

      <div className="mt-3 flex flex-col gap-1 text-xs font-bold text-white/35 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span>Try: restaurant, activity, budget, borough, vibe.</span>
        <span className="text-[#e1062a]">AI Suggestions</span>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <button
          onClick={onSend}
          disabled={loading}
          className="rounded-2xl bg-[#e1062a] px-7 py-4 text-sm font-black text-white shadow-2xl shadow-red-500/25 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Finding Matches..." : "Plan My Outing"}
        </button>

        <button
          type="button"
          onClick={onLocation}
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
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xl font-black text-white sm:text-2xl">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 sm:text-xs sm:tracking-[0.16em]">
        {label}
      </p>
    </div>
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
    <div className="mb-8 sm:mb-10">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-xl font-black tracking-tight text-white sm:text-2xl">
          {title}
        </h3>
        <p className="text-sm font-semibold leading-6 text-white/40">
          {subtitle}
        </p>
      </div>

      <div className="grid w-full gap-5 md:grid-cols-2">{children}</div>
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
  const safeScore = clampScore(score);
  const cleanReviewKeywords = Array.isArray(reviewKeywords)
    ? reviewKeywords.filter(Boolean).slice(0, 4)
    : [];

  const scoreRing = `conic-gradient(#e1062a ${Math.round(
    safeScore
  )}%, rgba(255,255,255,0.13) 0)`;

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
    premiumBadges.push("Hookah");
  }

  if (combinedText.includes("cigar")) {
    premiumBadges.push("Cigar Friendly");
  }

  if (
    combinedText.includes("restaurant") ||
    combinedText.includes("dining") ||
    combinedText.includes("dinner") ||
    combinedText.includes("food")
  ) {
    premiumBadges.push("Full Dining");
  }

  if (
    combinedText.includes("lounge") ||
    combinedText.includes("music") ||
    combinedText.includes("dj") ||
    combinedText.includes("nightlife")
  ) {
    premiumBadges.push("Lounge Vibe");
  }

  if (combinedText.includes("romantic") || combinedText.includes("intimate")) {
    premiumBadges.push("Date Friendly");
  }

  if (combinedText.includes("upscale") || combinedText.includes("classy")) {
    premiumBadges.push("Upscale");
  }

  const uniquePremiumBadges = Array.from(new Set(premiumBadges)).slice(0, 5);

  const isLovedByGuests =
    typeof reviewScore === "number" && reviewScore >= 85 && Boolean(reviewCount);

  const isStrongMatch = safeScore >= 80;
  const isTopPick = index === 0 && safeScore >= 70;

  const whyPicked =
    cleanReviewKeywords.length > 0
      ? `RoseOut matched this because guests mention ${cleanReviewKeywords
          .slice(0, 3)
          .join(", ")}.`
      : primaryTag
      ? `RoseOut matched this for its ${primaryTag.toLowerCase()} vibe.`
      : "RoseOut matched this based on your outing request, location signals, and overall fit.";

  const openDetails = () => {
    onBeforeNavigate?.();
    onDetails();
    window.location.href = detailsHref;
  };

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
      className={`group relative w-full cursor-pointer overflow-hidden rounded-[1.5rem] border bg-[#111] shadow-2xl shadow-black/40 transition duration-500 hover:-translate-y-1 hover:border-[#e1062a]/70 hover:bg-[#151515] hover:shadow-red-500/10 sm:rounded-[2rem] ${
        selected
          ? "border-red-500 ring-2 ring-red-500/50"
          : "border-white/10"
      }`}
      style={{
        animation: `cardReveal 560ms ease-out ${index * 120}ms both`,
      }}
    >
      <div className="relative h-52 w-full overflow-hidden sm:h-64 lg:h-72">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={900}
            height={520}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-sm text-neutral-500">
            No image available
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />

        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/75 px-3 py-2 text-white shadow-xl backdrop-blur-xl sm:left-4 sm:top-4 sm:gap-3 sm:px-4 sm:py-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full p-[3px] sm:h-14 sm:w-14"
            style={{ background: scoreRing }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-xs font-black text-white sm:text-sm">
              {Math.round(safeScore)}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45 sm:text-[10px] sm:tracking-[0.2em]">
              Smart Match
            </p>
            <p className="text-xs font-black text-white sm:text-sm">Rating</p>
          </div>
        </div>

        <div className="absolute right-3 top-3 flex max-w-[52%] flex-col items-end gap-2 sm:right-4 sm:top-4 sm:max-w-[58%]">
          {isTopPick && (
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-black shadow-lg sm:px-3 sm:text-xs">
              Top Pick
            </span>
          )}

          {isLovedByGuests && (
            <span className="rounded-full bg-[#e1062a] px-2.5 py-1 text-[10px] font-black text-white shadow-lg sm:px-3 sm:text-xs">
              Loved by Guests
            </span>
          )}

          {isStrongMatch && (
            <span className="rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur sm:px-3 sm:text-xs">
              Strong Match
            </span>
          )}
        </div>

        {distance !== null && distance !== undefined && (
          <div className="absolute bottom-3 left-3 rounded-full bg-black/75 px-3 py-1 text-xs font-black text-white backdrop-blur sm:bottom-4 sm:left-4">
            {distance} mi away
          </div>
        )}

        {rating && (
          <div className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-black text-black shadow-lg sm:bottom-4 sm:right-4 sm:text-sm">
            🌹 {rating}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e1062a] sm:text-xs sm:tracking-[0.22em]">
            {eyebrow}
          </p>

          {reviewCount ? (
            <p className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white/45 sm:text-[11px]">
              {reviewCount} review{reviewCount === 1 ? "" : "s"}
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
          <h3 className="mt-2 break-words text-xl font-black tracking-tight text-white transition duration-200 group-hover/title:text-[#e1062a] sm:text-2xl">
            {title}
          </h3>
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
          <div className="mt-4 rounded-[1.25rem] border border-red-500/15 bg-gradient-to-br from-red-500/[0.1] via-red-500/[0.045] to-white/[0.025] p-4 sm:rounded-[1.35rem]">
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

        <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 sm:rounded-[1.35rem]">
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

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
    <div className="mt-6 space-y-8 overflow-x-hidden sm:space-y-10">
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#e1062a] sm:text-xs sm:tracking-[0.35em]">
          RoseOut is searching
        </p>

        <h2 className="mt-2 break-words text-xl font-black sm:text-2xl">
          {loadingText}
        </h2>

        <p className="mt-2 text-sm font-semibold text-white/40">
          Building your recommendations...
        </p>
      </div>

      <div className="grid w-full gap-5 md:grid-cols-2">
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
      className="overflow-hidden rounded-[1.5rem] border border-white/5 bg-[#0b0b0b] shadow-2xl shadow-black/30 sm:rounded-[2rem]"
      style={{
        animation: `skeletonReveal 520ms ease-out ${delay} both`,
      }}
    >
      <div className="relative h-52 w-full overflow-hidden bg-[#080808] sm:h-64 lg:h-72">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-[#050505] blur-sm" />
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/[0.045] to-transparent" />
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-3 w-24 animate-pulse rounded-full bg-red-500/15" />

        <div
          className={`mt-3 h-7 animate-pulse rounded-full bg-white/[0.055] ${
            index % 2 === 0 ? "w-4/5" : "w-2/3"
          }`}
        />

        <div className="h-4 w-full animate-pulse rounded-full bg-white/[0.05]" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/[0.045]" />

        <div className="mt-5 flex flex-wrap gap-3">
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

function RoseOutFooter() {
  return (
    <footer className="border-t border-white/10 bg-black px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xl font-black tracking-tight">
            Rose<span className="text-[#e1062a]">Out</span>
          </p>
          <p className="mt-2 max-w-md text-sm font-medium leading-6 text-white/45">
            AI-powered outing planning for restaurants, activities,
            celebrations, local experiences, and memorable plans.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-bold text-white/45">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <Link href="/business" className="transition hover:text-white">
            For Businesses
          </Link>
          <Link href="/pricing" className="transition hover:text-white">
            Pricing
          </Link>
          <Link href="/create" className="transition hover:text-white">
            Create Plan
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-5 text-xs font-bold text-white/30">
        © {new Date().getFullYear()} RoseOut. All rights reserved.
      </div>
    </footer>
  );
}