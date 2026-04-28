"use client";

import { useState } from "react";

export default function RestaurantApplyPage() {
  const [message, setMessage] = useState("");

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold">List Your Restaurant on RoseOut</h1>

        <p className="mt-3 text-neutral-400">
          Submit your restaurant to be featured in AI-generated date night plans.
        </p>

        <form className="mt-8 space-y-4 rounded-3xl bg-white p-6 text-black">
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Restaurant Name" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Street Address" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="City" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="State" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Zip Code" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Neighborhood" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Cuisine Type" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Price Range, example: $$" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Reservation Link" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Website" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Phone Number" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Email" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Instagram URL" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="TikTok URL" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="X URL" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Hours of Operation" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Kitchen Closing Time" />

          <textarea
            className="min-h-32 w-full rounded-xl border px-4 py-3"
            placeholder="Describe your restaurant atmosphere, food, vibe, lighting, and best occasions."
          />

          <button
            type="button"
            onClick={() => setMessage("Form layout is ready. Next we will connect it to Supabase.")}
            className="w-full rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black"
          >
            Submit Restaurant
          </button>

          {message && <p className="text-center font-semibold">{message}</p>}
        </form>
      </div>
    </main>
  );
}