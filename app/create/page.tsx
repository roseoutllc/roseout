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

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-14 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-yellow-500">
            RoseOut
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Plan Your Night
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
                        Top Matches for You
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

                            return (
                              <div
                                key={restaurantId || restaurantIndex}
                                className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-lg"
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
                                  <div>
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
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
  {r.date_style_tags?.slice(0, 3).map((tag, i) => (
    <span
      key={i}
      className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700"
    >
      {tag}
    </span>
  ))}
</div>

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
                            const activityId = String(a.id);

                            return (
                              <div
                                key={activityId || activityIndex}
                                className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-lg"
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
                                  <div>
                                    {a.roseout_score >= 80 && (
                                      <div className="mb-3 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-700">
                                        Top 10% Match
                                      </div>
                                    )}

                                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-yellow-600">
                                      {a.activity_type || "Activity"}
                                    </p>

                                    <h3 className="text-2xl font-bold text-black">
                                      {a.activity_name}
                                    </h3>

                                    <p className="mt-2 text-sm text-neutral-600">
                                      {a.address}, {a.city}, {a.state}{" "}
                                      {a.zip_code}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
  {a.date_style_tags?.slice(0, 3).map((tag, i) => (
    <span
      key={i}
      className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700"
    >
      {tag}
    </span>
  ))}
</div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {a.price_range && (
                                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                                          {a.price_range}
                                        </span>
                                      )}

                                      {a.atmosphere && (
                                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                                          {a.atmosphere}
                                        </span>
                                      )}

                                      {a.group_friendly && (
                                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                                          Group Friendly
                                        </span>
                                      )}
                                    </div>
                                  </div>

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
              : "Example: Plan a pizza date in Queens and bowling after"
          }
          className="mt-6 w-full rounded-[1.5rem] border border-white/10 bg-neutral-950 px-5 py-4 text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="mt-4 w-full rounded-full bg-yellow-500 px-6 py-4 font-extrabold text-black"
        >
          {loading ? "Thinking..." : messages.length ? "Send" : "Create Plan"}
        </button>
      </div>
    </main>
  );
}