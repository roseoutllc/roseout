"use client";

import { useState } from "react";

export default function RestaurantApplyPage() {
  const [form, setForm] = useState({
    restaurant_name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    email: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/restaurants/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Submission failed.");
        return;
      }

      setMessage(
        "Success! Your restaurant was submitted. Check your email for your login link."
      );

      setForm({
        restaurant_name: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        email: "",
        description: "",
      });
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="text-4xl font-bold">
          List Your Restaurant on RoseOut
        </h1>

        <p className="mt-3 text-neutral-400">
          Get discovered in AI-powered date and outing plans.
        </p>

        <div className="mt-8 space-y-4 rounded-3xl bg-white p-6 text-black">
          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Restaurant Name"
            value={form.restaurant_name}
            onChange={(e) => update("restaurant_name", e.target.value)}
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Address"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="City"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="State"
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Zip Code"
            value={form.zip_code}
            onChange={(e) => update("zip_code", e.target.value)}
          />

          <input
            type="email"
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />

          <textarea
            className="min-h-28 w-full rounded-xl border px-4 py-3"
            placeholder="Describe your restaurant (vibe, cuisine, atmosphere)"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />

          <button
            onClick={submit}
            disabled={
              loading ||
              !form.restaurant_name.trim() ||
              !form.email.trim()
            }
            className="w-full rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Restaurant"}
          </button>

          {message && (
            <p className="text-center font-semibold">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}