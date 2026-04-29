"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ClaimPage() {
  const params = useParams();
  const token = params.token as string;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    message: "",
  });

  useEffect(() => {
    const loadRestaurant = async () => {
      const res = await fetch(`/api/claim/lookup?token=${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Claim link not found.");
      } else {
        setRestaurant(data.restaurant);
      }

      setLoading(false);
    };

    if (token) loadRestaurant();
  }, [token]);

  const submitClaim = async () => {
    setError("");

    const res = await fetch("/api/claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        ...form,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Could not submit claim.");
      return;
    }

    setSubmitted(true);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  if (error && !restaurant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-md rounded-3xl bg-white p-6 text-center text-black">
          <h1 className="text-2xl font-bold">Claim Link Not Found</h1>
          <p className="mt-2 text-neutral-600">{error}</p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-md rounded-3xl bg-white p-6 text-center text-black">
          <h1 className="text-2xl font-bold">Claim Submitted</h1>
          <p className="mt-3 text-neutral-600">
            Thank you. RoseOut will review your request and contact you soon.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-500">
          RoseOut
        </p>

        <h1 className="mt-3 text-4xl font-bold">Claim Your Listing</h1>

        <div className="mt-8 rounded-3xl bg-white p-6 text-black">
          <h2 className="text-2xl font-bold">
            {restaurant?.restaurant_name}
          </h2>

          <p className="mt-2 text-neutral-600">
            {restaurant?.address}, {restaurant?.city}, {restaurant?.state}{" "}
            {restaurant?.zip_code}
          </p>

          <div className="mt-6 grid gap-4">
            <input
              value={form.owner_name}
              onChange={(e) =>
                setForm({ ...form, owner_name: e.target.value })
              }
              placeholder="Your full name"
              className="rounded-2xl border px-4 py-3"
            />

            <input
              value={form.owner_email}
              onChange={(e) =>
                setForm({ ...form, owner_email: e.target.value })
              }
              placeholder="Business email"
              type="email"
              className="rounded-2xl border px-4 py-3"
            />

            <input
              value={form.owner_phone}
              onChange={(e) =>
                setForm({ ...form, owner_phone: e.target.value })
              }
              placeholder="Phone number"
              className="rounded-2xl border px-4 py-3"
            />

            <textarea
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
              placeholder="Optional message"
              className="min-h-28 rounded-2xl border px-4 py-3"
            />

            {error && (
              <div className="rounded-2xl bg-red-100 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={submitClaim}
              className="rounded-full bg-yellow-500 px-6 py-4 font-extrabold text-black"
            >
              Submit Claim
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}