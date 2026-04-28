"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Turnstile from "react-turnstile";

function RestaurantApplyForm() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");

  const [form, setForm] = useState({
    restaurant_name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    neighborhood: "",
    cuisine_type: "",
    price_range: "",
    reservation_link: "",
    website: "",
    phone: "",
    email: "",
    instagram_url: "",
    tiktok_url: "",
    x_url: "",
    hours_of_operation: "",
    kitchen_closing_time: "",
    description: "",
  });

  const [captchaToken, setCaptchaToken] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!inviteCode) return;

    fetch("/api/invites/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ invite_code: inviteCode }),
    });
  }, [inviteCode]);

  const update = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const submitRestaurant = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/restaurants/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          captchaToken,
          invite_code: inviteCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`Error: ${data.error || "Submission failed"}`);
        return;
      }

      setMessage("Restaurant submitted successfully for review.");
      setCaptchaToken("");
    } catch {
      setMessage("Error: Could not submit restaurant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold">List Your Restaurant on RoseOut</h1>

        <p className="mt-3 text-neutral-400">
          Submit your restaurant to be featured in AI-generated date night plans.
        </p>

        {inviteCode && (
          <p className="mt-4 rounded-xl bg-yellow-500 px-4 py-3 font-semibold text-black">
            Invite Code: {inviteCode}
          </p>
        )}

        <div className="mt-8 space-y-4 rounded-3xl bg-white p-6 text-black">
          {Object.entries(form).map(([key, value]) =>
            key === "description" ? (
              <textarea
                key={key}
                className="min-h-32 w-full rounded-xl border px-4 py-3"
                placeholder="Describe your restaurant atmosphere, food, vibe, lighting, and best occasions."
                value={value}
                onChange={(e) => update(key, e.target.value)}
              />
            ) : (
              <input
                key={key}
                className="w-full rounded-xl border px-4 py-3"
                placeholder={key.replaceAll("_", " ")}
                value={value}
                onChange={(e) => update(key, e.target.value)}
              />
            )
          )}

          <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onVerify={(token) => setCaptchaToken(token)}
          />

          <button
            type="button"
            onClick={submitRestaurant}
            disabled={loading || !form.restaurant_name.trim() || !captchaToken}
            className="w-full rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Restaurant"}
          </button>

          {message && <p className="text-center font-semibold">{message}</p>}
        </div>
      </div>
    </main>
  );
}

export default function RestaurantApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-6">Loading...</div>}>
      <RestaurantApplyForm />
    </Suspense>
  );
}