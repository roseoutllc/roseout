"use client";

import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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
    const sendMessage = async (overrideInput?: string) => {
    const message = overrideInput || input;
    if (!message.trim()) return;

    setLoading(true);
    setError("");

    try {
      const userLocation = getSavedUserLocation();

      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          input: message,
          messages,
          lat: userLocation?.latitude,
          lng: userLocation?.longitude,
        }),
      });

      const data = await response.json();

      const newMessages: Message[] = [
        ...messages,
        { role: "user", content: message },
        {
          role: "assistant",
          content: data.reply,
          restaurants: data.restaurants,
          activities: data.activities,
        },
      ];

      setMessages(newMessages);
      setInput("");

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err) {
      setError("Something went wrong. Try again.");
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

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-black pt-[120px] text-white md:pt-24">
      
      {/* HERO FIXED FOR MOBILE */}
      <section
        className={`relative border-b border-white/10 transition-all duration-500 ${
          hasSearched ? "py-4" : "py-6 sm:py-10"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(225,6,42,0.25),transparent_35%),linear-gradient(180deg,#050505,#000)]" />

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          {!hasSearched && (
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              
              {/* TEXT SIDE */}
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#e1062a] sm:text-xs">
                  AI outing planner
                </p>

                <h1 className="mt-3 text-[36px] font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  What are we
                  <br />
                  <span className="text-[#e1062a]">planning?</span>
                </h1>

                <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
                  Type naturally. RoseOut understands your vibe, budget, and location.
                </p>
              </div>

              {/* INPUT CARD */}
              <div className="w-full rounded-2xl border border-white/10 bg-[#0d0d0d]/95 p-4 shadow-xl backdrop-blur">
                <div className="relative">
                  {!input && (
                    <div className="pointer-events-none absolute left-3 right-3 top-3 text-sm text-white/40">
                      {typedSuggestion}
                      <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-white/60" />
                    </div>
                  )}

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-[#e1062a]/70 bg-black px-3 py-3 text-sm text-white outline-none"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                  <span>Try full sentences</span>
                  <span className="text-[#e1062a]">AI Suggestions</span>
                </div>

                {error && (
                  <div className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3">
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading}
                    className="rounded-xl bg-[#e1062a] py-3 text-sm font-black text-white"
                  >
                    {loading ? loadingMessages[loadingTextIndex] : "Plan My Outing"}
                  </button>

                  <button
                    onClick={requestUserLocation}
                    className="rounded-xl border border-white/15 py-3 text-sm font-black text-white"
                  >
                    {locationSaved ? "✓ Location Saved" : "Use My Location"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RESULTS */}
      <div ref={resultsRef} className="mx-auto max-w-6xl px-4 py-6">
        {messages.map((msg, i) => (
          <div key={i} className="mb-6">
            {msg.role === "assistant" && (
              <>
                <p className="mb-3 text-lg font-bold">
                  {msg.content}
                </p>

                <div className="grid gap-5">
                  {msg.restaurants?.map((r) => (
                    <ResultCard key={r.id} item={r} type="restaurant" />
                  ))}

                  {msg.activities?.map((a) => (
                    <ResultCard key={a.id} item={a} type="activity" />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
function ResultCard({
  item,
  type,
}: {
  item: RestaurantCard | ActivityCard;
  type: "restaurant" | "activity";
}) {
  const isRestaurant = type === "restaurant";

  const title = isRestaurant
    ? (item as RestaurantCard).restaurant_name
    : (item as ActivityCard).activity_name;

  const address = [item.address, item.city, item.state, item.zip_code]
    .filter(Boolean)
    .join(", ");

  const detailsHref = isRestaurant
    ? `/locations/restaurants/${item.id}?from=/create`
    : `/locations/activities/${item.id}?from=/create`;

  const reservationUrl = item.reservation_url || item.reservation_link;
  const safeScore = clampScore(item.roseout_score || 0);

  const scoreRing = `conic-gradient(#e1062a ${Math.round(
    safeScore
  )}%, rgba(255,255,255,0.16) 0)`;

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0d0d0d] shadow-2xl shadow-black/40">
      <div className="relative h-52 w-full overflow-hidden sm:h-64">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={title}
            width={900}
            height={520}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-sm font-bold text-white/35">
            No image available
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-xl border border-red-500/35 bg-black/80 px-2.5 py-2 backdrop-blur-xl">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full p-[3px]"
            style={{ background: scoreRing }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-xs font-black text-white">
              {Math.round(safeScore)}
            </div>
          </div>

          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/40">
              RoseOut Score
            </p>
            <p className="text-xs font-black text-white">
              {Math.round(safeScore)}/100
            </p>
          </div>
        </div>

        <div className="absolute right-3 top-3 flex max-w-[44%] flex-col items-end gap-1.5">
          {safeScore >= 70 && (
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-black">
              🏆 Top
            </span>
          )}

          {safeScore >= 80 && (
            <span className="rounded-full border border-white/20 bg-black/75 px-3 py-1 text-[10px] font-black text-white backdrop-blur">
              🔥 Match
            </span>
          )}
        </div>

        {item.rating && (
          <div className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-black text-black">
            🌹 {item.rating}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#e1062a]">
            {isRestaurant ? "Restaurant" : (item as ActivityCard).activity_type || "Activity"}
          </p>

          {item.review_count ? (
            <p className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-black text-white/45">
              🌸 {item.review_count} reviews
            </p>
          ) : null}
        </div>

        <Link href={detailsHref}>
          <h3 className="mt-2 break-words text-2xl font-black leading-tight text-white">
            {title}
          </h3>
        </Link>

        {address && (
          <p className="mt-3 break-words text-sm leading-6 text-white/50">
            {address}
          </p>
        )}

        {item.primary_tag && (
          <p className="mt-4 text-sm font-black text-white">
            ✨ {item.primary_tag}
          </p>
        )}

        {item.date_style_tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.date_style_tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/55"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          <Link
            href={detailsHref}
            className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-black"
          >
            View Details
          </Link>

          {item.website && (
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-black text-white"
            >
              Website
            </a>
          )}

          {reservationUrl && (
            <a
              href={reservationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-red-500/40 bg-red-500/10 px-5 py-3 text-center text-sm font-black text-red-100"
            >
              {isRestaurant ? "Reserve" : "Book"}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}