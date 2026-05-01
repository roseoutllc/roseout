"use client";

import { useState } from "react";

type LocationReviewFormProps = {
  locationType: "restaurant" | "activity";
  locationId: string;
};

export default function LocationReviewForm({
  locationType,
  locationId,
}: LocationReviewFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = {
      location_type: locationType,
      restaurant_id: locationType === "restaurant" ? locationId : null,
      activity_id: locationType === "activity" ? locationId : null,
      customer_name: customerName,
      rating,
      review_text: reviewText,
    };

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    setMessage("Thank you! Your review helps RoseOut make better recommendations.");
    setCustomerName("");
    setRating(5);
    setReviewText("");
    setLoading(false);
  }

  return (
    <form
      onSubmit={submitReview}
      className="rounded-[2rem] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur"
    >
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.3em] text-rose-300">
          RoseOut Review
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-white">
          Share your experience
        </h3>
        <p className="mt-2 text-sm text-white/60">
          Write a few full sentences. Mention the vibe, service, noise level,
          food, price, or if it’s good for a date night.
        </p>
      </div>

      <label className="mb-4 block">
        <span className="mb-2 block text-sm text-white/70">Your name</span>
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Optional"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-rose-400"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-2 block text-sm text-white/70">Rating</span>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-rose-400"
        >
          <option value={5}>5 flowers — Excellent</option>
          <option value={4}>4 flowers — Good</option>
          <option value={3}>3 flowers — Average</option>
          <option value={2}>2 flowers — Not great</option>
          <option value={1}>1 flower — Poor</option>
        </select>
      </label>

      <label className="mb-4 block">
        <span className="mb-2 block text-sm text-white/70">
          Full-sentence review
        </span>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          required
          minLength={30}
          rows={5}
          placeholder="Example: The restaurant had a romantic vibe with beautiful lighting. The food was great, but the music was a little loud for a quiet date night."
          className="w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-rose-400"
        />
        <p className="mt-2 text-xs text-white/45">
          Minimum 30 characters. Full sentences help RoseOut score locations better.
        </p>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-rose-600 px-6 py-3 font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Analyzing review..." : "Submit Review"}
      </button>

      {message && (
        <p className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-white/80">
          {message}
        </p>
      )}
    </form>
  );
}