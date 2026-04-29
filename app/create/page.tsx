"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
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

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.result || "No response generated.",
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
          {loading ? "Thinking..." : messages.length ? "Send" : "Create Plan"}
        </button>
      </div>
    </main>
  );
}