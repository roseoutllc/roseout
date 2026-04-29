"use client";

import { useState } from "react";

type RestaurantCard = {
  id: string;
  restaurant_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  roseout_score: number;
  reservation_link?: string;
  website?: string;
  image_url?: string;
  rating?: number | null;
  review_count?: number | null;
  primary_tag?: string | null;
  date_style_tags?: string[];
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
  website?: string;
  image_url?: string;
  rating?: number | null;
  review_count?: number | null;
  primary_tag?: string | null;
  date_style_tags?: string[];
};

type Message = {
  role: "user" | "assistant";
  content: string;
  restaurants?: RestaurantCard[];
  activities?: ActivityCard[];
};

export default function CreatePage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedRestaurant, setSelectedRestaurant] =
    useState<RestaurantCard | null>(null);

  const [selectedActivity, setSelectedActivity] =
    useState<ActivityCard | null>(null);

  const sendMessage = async () => {
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
          messages: nextMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      const assistantReply =
        data.reply || data.message || data.answer || "";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantReply,
          restaurants: data.restaurants || [],
          activities: data.activities || [],
        },
      ]);
    } catch {
      setError("Could not create response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPlanButtonText = () => {
    if (selectedRestaurant && selectedActivity) return "View Full Plan";
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
    <main className="min-h-screen bg-[#050505] px-5 py-14 pb-40 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-yellow-500">
            RoseOut
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Plan Your Outing
          </h1>

          <p className="mt-3 text-neutral-400">
            Tell RoseOut what kind of outing you want, and get curated matches.
          </p>
        </div>

        <div className="space-y-5">
          {messages.map((msg, index) => {
            const hasRestaurants = !!msg.restaurants?.length;
            const hasActivities = !!msg.activities?.length;

            return (
              <div
                key={index}
                className={`rounded-[2rem] p-5 ${
                  msg.role === "user"
                    ? "bg-yellow-500 text-black"
                    : "border border-white/10 bg-white text-black shadow-2xl"
                }`}
              >
                {msg.role === "user" && (
                  <p className="whitespace-pre-wrap font-medium">
                    {msg.content}
                  </p>
                )}

                {msg.role === "assistant" &&
                (hasRestaurants || hasActivities) ? (
                  <>
                    <div className="mb-5">
                      <p className="text-xl font-bold text-black">
                        ✨ Here’s what RoseOut found
                      </p>

                      <p className="mt-1 text-sm font-medium text-neutral-500">
                        Select what you like to build your plan.
                      </p>
                    </div>

                    {hasRestaurants && (
                      <div className="mb-8">
                        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
                          Restaurants
                        </h2>

                        <div className="grid gap-5">
                          {msg.restaurants?.map((r, restaurantIndex) => {
                            const restaurantId = String(r.id);
                            const isSelected =
                              selectedRestaurant?.id === r.id;

                            return (
                              <div
                                key={restaurantId || restaurantIndex}
                                className={`overflow-hidden rounded-[1.75rem] border bg-white shadow-lg transition ${
                                  isSelected
                                    ? "border-yellow-500 ring-2 ring-yellow-500"
                                    : "border-neutral-200"
                                }`}
                              >
                                {r.image_url ? (
                                  <img
                                    src={r.image_url}
                                    alt={r.restaurant_name}
                                    className="h-56 w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-56 items-center justify-center bg-neutral-200 text-neutral-500">
                                    No image available
                                  </div>
                                )}

                                <div className="p-5">
                                  {r.roseout_score >= 80 && (
                                    <div className="mb-3 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-700">
                                      Top 10% Match
                                    </div>
                                  )}

                                  <h3 className="text-2xl font-bold text-black">
                                    {r.restaurant_name}
                                  </h3>

                                  <p className="mt-2 text-sm text-neutral-600">
                                    {r.address}, {r.city}, {r.state}{" "}
                                    {r.zip_code}
                                  </p>

                                  {r.rating && (
                                    <p className="mt-2 text-sm font-semibold text-neutral-700">
                                      ⭐ {r.rating}
                                      {r.review_count
                                        ? ` (${r.review_count} reviews)`
                                        : ""}
                                    </p>
                                  )}

                                  {r.primary_tag && (
                                    <p className="mt-3 text-sm font-bold text-black">
                                      ✨ {r.primary_tag}
                                    </p>
                                  )}

                                  {r.date_style_tags?.length ? (
                                    <p className="mt-1 text-sm text-neutral-500">
                                      {r.date_style_tags
                                        .slice(0, 3)
                                        .join(" · ")}
                                    </p>
                                  ) : null}

                                  <div className="mt-4">
                                    <div className="mb-2 flex items-center justify-between">
                                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                        RoseOut Match
                                      </span>

                                      <span className="text-xs font-bold text-black">
                                        {r.roseout_score}/100
                                      </span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                                      <div
                                        className="h-full rounded-full bg-yellow-500 transition-all duration-500"
                                        style={{
                                          width: `${Math.min(
                                            r.roseout_score,
                                            100
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div className="mt-5 flex flex-wrap gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedRestaurant(r)}
                                      className={`rounded-full px-5 py-2.5 text-sm font-bold ${
                                        isSelected
                                          ? "bg-yellow-500 text-black"
                                          : "border border-black text-black"
                                      }`}
                                    >
                                      {isSelected
                                        ? "Selected"
                                        : "Select Restaurant"}
                                    </button>

                                    <a
                                      href={`/restaurants/${restaurantId}`}
                                      className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white"
                                    >
                                      View Details
                                    </a>

                                    {r.reservation_link && (
                                      <a
                                        href={r.reservation_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full border border-black px-5 py-2.5 text-sm font-bold text-black"
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
                        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
                          Activities
                        </h2>

                        <div className="grid gap-5">
                          {msg.activities?.map((a, activityIndex) => {
                            const isSelected =
                              selectedActivity?.id === a.id;

                            return (
                              <div
                                key={a.id || activityIndex}
                                className={`overflow-hidden rounded-[1.75rem] border bg-white shadow-lg transition ${
                                  isSelected
                                    ? "border-yellow-500 ring-2 ring-yellow-500"
                                    : "border-neutral-200"
                                }`}
                              >
                                {a.image_url ? (
                                  <img
                                    src={a.image_url}
                                    alt={a.activity_name}
                                    className="h-56 w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-56 items-center justify-center bg-neutral-200 text-neutral-500">
                                    No image available
                                  </div>
                                )}

                                <div className="p-5">
                                  {a.roseout_score >= 80 && (
                                    <div className="mb-3 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-700">
                                      Top 10% Match
                                    </div>
                                  )}

                                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-yellow-600">
                                    {a.activity_type === "Museum"
                                      ? "🏛 Museum"
                                      : a.activity_type || "Activity"}
                                  </p>

                                  <h3 className="text-2xl font-bold text-black">
                                    {a.activity_name}
                                  </h3>

                                  <p className="mt-2 text-sm text-neutral-600">
                                    {a.address}, {a.city}, {a.state}{" "}
                                    {a.zip_code}
                                  </p>

                                  {a.rating && (
                                    <p className="mt-2 text-sm font-semibold text-neutral-700">
                                      ⭐ {a.rating}
                                      {a.review_count
                                        ? ` (${a.review_count} reviews)`
                                        : ""}
                                    </p>
                                  )}

                                  {a.primary_tag && (
                                    <p className="mt-3 text-sm font-bold text-black">
                                      ✨ {a.primary_tag}
                                    </p>
                                  )}

                                  {a.date_style_tags?.length ? (
                                    <p className="mt-1 text-sm text-neutral-500">
                                      {a.date_style_tags
                                        .slice(0, 3)
                                        .join(" · ")}
                                    </p>
                                  ) : null}

                                  <div className="mt-4">
                                    <div className="mb-2 flex items-center justify-between">
                                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                        RoseOut Match
                                      </span>

                                      <span className="text-xs font-bold text-black">
                                        {a.roseout_score}/100
                                      </span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                                      <div
                                        className="h-full rounded-full bg-yellow-500 transition-all duration-500"
                                        style={{
                                          width: `${Math.min(
                                            a.roseout_score,
                                            100
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div className="mt-5 flex flex-wrap gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedActivity(a)}
                                      className={`rounded-full px-5 py-2.5 text-sm font-bold ${
                                        isSelected
                                          ? "bg-yellow-500 text-black"
                                          : "border border-black text-black"
                                      }`}
                                    >
                                      {isSelected
                                        ? "Selected"
                                        : "Select Activity"}
                                    </button>

                                    {a.website && (
                                      <a
                                        href={a.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white"
                                      >
                                        View Website
                                      </a>
                                    )}

                                    {a.reservation_link && (
                                      <a
                                        href={a.reservation_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full border border-black px-5 py-2.5 text-sm font-bold text-black"
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
        </div>

        {loading && (
          <p className="mt-6 text-center text-neutral-400">Thinking...</p>
        )}

        {error && (
          <div className="mt-6 rounded-2xl bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            messages.length
              ? "Ask a follow-up question..."
              : "Example: Plan a romantic dinner in Queens"
          }
          className="mt-6 w-full rounded-[1.5rem] border border-white/10 bg-neutral-950 px-5 py-4 text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="mt-4 w-full rounded-full bg-yellow-500 px-6 py-4 font-extrabold text-black disabled:opacity-50"
        >
          {loading ? "Thinking..." : messages.length ? "Send" : "Create Plan"}
        </button>
      </div>

      {(selectedRestaurant || selectedActivity) && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/95 p-4 text-white backdrop-blur">
          <div className="mx-auto max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">
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
              className="mt-3 w-full rounded-full bg-yellow-500 px-5 py-3 font-extrabold text-black"
            >
              {getPlanButtonText()}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}