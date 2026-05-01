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
  const [message, setMessage] = useState("");

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

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

    setMessage("Review submitted successfully!");
    setCustomerName("");
    setRating(5);
    setReviewText("");
    setLoading(false);
  }

  return (
    <form
      onSubmit={submitReview}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur"
    >
      <h3 className="text-xl font-bold">Leave a Review</h3>

      <input
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full mt-4 p-3 rounded-xl bg-black border border-white/10"
      />

      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="w-full mt-4 p-3 rounded-xl bg-black border border-white/10"
      >
        <option value={5}>5</option>
        <option value={4}>4</option>
        <option value={3}>3</option>
        <option value={2}>2</option>
        <option value={1}>1</option>
      </select>

      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        required
        minLength={30}
        rows={4}
        placeholder="Write your experience in full sentences..."
        className="w-full mt-4 p-3 rounded-xl bg-black border border-white/10"
      />

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full bg-red-600 py-3 rounded-full font-semibold"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>

      {message && <p className="mt-3 text-sm">{message}</p>}
    </form>
  );
}