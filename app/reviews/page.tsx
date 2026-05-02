"use client";

import { useState } from "react";

export default function ReviewsPage() {
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/reviews/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reviewText }),
    });

    const data = await res.json();
    setResult(data.analysis);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Review AI Tester</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-4 rounded bg-gray-900 border border-gray-700"
          rows={6}
          placeholder="Write a review..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
        />

        <button
          type="submit"
          className="mt-4 bg-red-600 px-6 py-3 rounded"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {result && (
        <pre className="mt-6 bg-gray-900 p-4 rounded text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}