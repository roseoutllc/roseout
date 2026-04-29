"use client";

import { useState } from "react";
import Link from "next/link";

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
};

type Message = {
  role: "user" | "assistant";
  content: string;
  restaurants?: RestaurantCard[];
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
        },
      ]);
    } catch {
      setError("Could not create response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold">Plan Your Night</h1>

        <p className="mt-3 text-neutral-400">
          Ask RoseOut for a plan, then ask follow-up questions.
        </p>

        <div className="mt-8 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`rounded-3xl p-5 ${
                msg.role === "user"
                  ? "bg-yellow-500 text-black"
                  : "bg-white text-black"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {msg.role === "assistant" &&
              msg.restaurants?.length ? (
                <div className="mt-5 grid gap-4">
                  {msg.restaurants.map((r) => (
                    <div
                      key={r.id}
                      className="overflow-hidden rounded-2xl border bg-neutral-50"
                    >
                      {r.image_url ? (
                        <img
                          src={r.image_url}
                          alt={r.restaurant_name}
                          className="h-44 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-44 items-center justify-center bg-neutral-200 text-sm text-neutral-500">
                          No image available
                        </div>
                      )}

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-bold">
                              {r.restaurant_name}
                            </h3>

                            <p className="mt-1 text-sm text-neutral-600">
                              {r.address}, {r.city}, {r.state}{" "}
                              {r.zip_code}
                            </p>
                          </div>

                          <span className="rounded-full bg-yellow-500 px-3 py-1 text-sm font-bold text-black">
                            {r.roseout_score}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {r.reservation_link && (
                            <a
                              href={r.reservation_link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <button className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
                                Reserve
                              </button>
                            </a>
                          )}

                          {/* ✅ FIXED: Proper Next.js routing */}
                          <Link href={`/restaurants/${r.id}`}>
                            <button className="rounded-xl border border-black px-4 py-2 text-sm font-semibold text-black">
                              View Details
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {loading && (
          <p className="mt-6 text-center text-neutral-400">
            Thinking...
          </p>
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
              : "Example: Plan a pizza date in Queens that’s not too loud"
          }
          className="mt-6 w-full rounded-2xl border border-neutral-700 bg-black px-4 py-4 text-white placeholder-neutral-500 focus:outline-none"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="mt-4 w-full rounded-2xl bg-yellow-500 px-6 py-3 font-bold text-black disabled:opacity-50"
        >
          {loading
            ? "Thinking..."
            : messages.length
            ? "Send"
            : "Create Plan"}
        </button>
      </div>
    </main>
  );
}