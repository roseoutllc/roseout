"use client";

import { useState } from "react";

export default function CreatePage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createPlan = async () => {
    if (!input.trim()) {
      setError("Please enter what you’re looking for.");
      return;
    }

    setLoading(true);
    setResult("");
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      // ✅ FIX: safely read response
      setResult(data.result || data.output_text || "No plan was generated.");
    } catch (err) {
      setError("Could not create plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold">Plan Your Night</h1>

        <p className="mt-3 text-neutral-400">
          Tell RoseOut what you're in the mood for.
        </p>

        {/* INPUT */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Example: Plan a pizza date in Brooklyn that’s not too loud"
          className="mt-6 w-full rounded-2xl border border-neutral-700 bg-black px-4 py-4 text-white placeholder-neutral-500 focus:outline-none"
        />

        {/* BUTTON */}
        <button
          onClick={createPlan}
          disabled={loading}
          className="mt-4 w-full rounded-2xl bg-yellow-500 px-6 py-3 font-bold text-black disabled:opacity-50"
        >
          {loading ? "Planning..." : "Create Plan"}
        </button>

        {/* LOADING */}
        {loading && (
          <p className="mt-6 text-center text-neutral-400">
            Planning your perfect night...
          </p>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-2xl bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div className="mt-6 whitespace-pre-wrap rounded-3xl bg-white p-6 text-black">
            {result}
          </div>
        )}
      </div>
    </main>
  );
}