"use client";

import { useState } from "react";

type LocationReviewFormProps = {
  locationId: string;
};

export default function LocationReviewForm({
  locationId,
}: LocationReviewFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ THIS IS WHERE YOUR ERROR WAS
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
          customer_name: customerName,
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

      setMessage(
        "✨ Thanks! Your review is helping RoseOut improve recommendations."
      );

      setCustomerName("");
      setRating(5);
      setReviewText("");
      setSubmitted(true);
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <form
      onSubmit={submitReview}
      className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl"
    >
      <h3 className="text-xl font-bold text-white">Leave a Review</h3>

      <input
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        placeholder="Your name (optional)"
        disabled={submitted}
        className="mt-4 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
      />

      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        disabled={submitted}
        className="mt-4 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
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
        rows={4}
        disabled={submitted}
        placeholder="Write your experience in full sentences..."
        className="mt-4 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
      />

      <button
        type="submit"
        disabled={loading || submitted}
        className="mt-5 w-full rounded-full bg-red-600 py-3 font-bold text-white disabled:opacity-50"
      >
        {submitted ? "Submitted ✓" : loading ? "Submitting..." : "Submit Review"}
      </button>

      {message && (
        <p className="mt-3 text-sm text-white/70">{message}</p>
      )}
    </form>
  );
}