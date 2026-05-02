"use client";

import { useState } from "react";

type LocationReviewFormProps = {
  locationId: string;
  onReviewSubmitted?: (data: any) => void;
};

export default function LocationReviewForm({
  locationId,
  onReviewSubmitted,
}: LocationReviewFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();

    if (submitted) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_id: locationId,
          customer_name: customerName || "RoseOut Guest",
          rating,
          review_text: reviewText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      setMessage("✨ Thanks! Your review helped update this RoseOut score.");

      onReviewSubmitted?.({
        ...data,
        customer_name: customerName || "RoseOut Guest",
        rating,
        review_text: reviewText,
      });

      setCustomerName("");
      setRating(5);
      setReviewText("");
      setSubmitted(true);
    } catch {
      setMessage("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <form
      onSubmit={submitReview}
      className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl"
    >
      <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
        RoseOut Review
      </p>

      <h3 className="mt-2 text-2xl font-black text-white">
        Leave a Review
      </h3>

      <p className="mt-2 text-sm leading-6 text-white/60">
        Your words help RoseOut understand the vibe, service, food, noise level,
        and best date-night fit.
      </p>

      <input
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        placeholder="Your name (optional)"
        disabled={submitted}
        className="mt-5 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-400"
      />

      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        disabled={submitted}
        className="mt-4 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-400"
      >
        <option value={5}>🌸🌸🌸🌸🌸 Excellent</option>
        <option value={4}>🌸🌸🌸🌸 Good</option>
        <option value={3}>🌸🌸🌸 Average</option>
        <option value={2}>🌸🌸 Not great</option>
        <option value={1}>🌸 Poor</option>
      </select>

      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        required
        minLength={30}
        rows={5}
        disabled={submitted}
        placeholder="Example: The food was amazing and the vibe was romantic, but the music was a little loud."
        className="mt-4 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-400"
      />

      <button
        type="submit"
        disabled={loading || submitted}
        className="mt-5 w-full rounded-full bg-red-600 py-3 font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitted ? "Submitted ✓" : loading ? "Submitting..." : "Submit Review"}
      </button>

      {message && (
        <p className="mt-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/70">
          {message}
        </p>
      )}
    </form>
  );
}