"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Turnstile from "react-turnstile";

export default function RestaurantApplyPage() {
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
      body: JSON.stringify({
        invite_code: inviteCode,
      }),
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

      setForm({
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
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Restaurant Name" value={form.restaurant_name} onChange={(e) => update("restaurant_name", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Street Address" value={form.address} onChange={(e) => update("address", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="City" value={form.city} onChange={(e) => update("city", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="State" value={form.state} onChange={(e) => update("state", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Zip Code" value={form.zip_code} onChange={(e) => update("zip_code", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Neighborhood" value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Cuisine Type" value={form.cuisine_type} onChange={(e) => update("cuisine_type", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Price Range, example: $$" value={form.price_range} onChange={(e) => update("price_range", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Reservation Link" value={form.reservation_link} onChange={(e) => update("reservation_link", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Website" value={form.website} onChange={(e) => update("website", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Phone Number" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Instagram URL" value={form.instagram_url} onChange={(e) => update("instagram_url", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="TikTok URL" value={form.tiktok_url} onChange={(e) => update("tiktok_url", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="X URL" value={form.x_url} onChange={(e) => update("x_url", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Hours of Operation" value={form.hours_of_operation} onChange={(e) => update("hours_of_operation", e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Kitchen Closing Time" value={form.kitchen_closing_time} onChange={(e) => update("kitchen_closing_time", e.target.value)} />

          <textarea
            className="min-h-32 w-full rounded-xl border px-4 py-3"
            placeholder="Describe your restaurant atmosphere, food, vibe, lighting, and best occasions."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />

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