"use client";

import { useState } from "react";

export default function CreatePage() {
  const [request, setRequest] = useState("");
  const [plan, setPlan] = useState("");
  const [links, setLinks] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    try {
      setLoading(true);
      setPlan("");
      setLinks(null);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ request }),
      });

      const data = await res.json();

      console.log("API RESPONSE:", data); // 👈 debug

      if (!res.ok) {
        setPlan(`Error: ${data.error || "Something went wrong"}`);
        return;
      }

      setPlan(data.plan);
      setLinks(data.links); // 👈 IMPORTANT
    } catch (error) {
      console.error(error);
      setPlan("Error: Could not reach API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold">
          What kind of night are you planning?
        </h1>

        <p className="mt-3 text-neutral-400">
          Tell RoseOut what you want in your own words.
        </p>

        {/* INPUT BOX */}
        <div className="mt-8 rounded-3xl bg-white p-6 text-black">
          <textarea
            className="min-h-40 w-full rounded-xl border px-4 py-3"
            placeholder="Example: Plan a romantic date night in Queens this Friday under $150 with dinner, dessert, and something fun after."
            value={request}
            onChange={(e) => setRequest(e.target.value)}
          />

          <button
            onClick={generatePlan}
            disabled={loading || !request.trim()}
            className="mt-4 w-full rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black disabled:opacity-50"
          >
            {loading ? "Planning your perfect night..." : "Create My Plan"}
          </button>
        </div>

        {/* RESULT */}
        {plan && (
          <div className="mt-8 rounded-3xl bg-white p-6 text-black">
            <h2 className="text-2xl font-bold">Your RoseOut Plan</h2>

            <p className="mt-4 whitespace-pre-line leading-8">
              {plan}
            </p>

            {/* BOOKING BUTTONS */}
            {links && (
              <div className="mt-6 space-y-3">
                <a href={links.dinner} target="_blank">
                  <button className="w-full bg-black text-white py-3 rounded-xl">
                    🍽 Book Dinner
                  </button>
                </a>

                <a href={links.activity} target="_blank">
                  <button className="w-full bg-black text-white py-3 rounded-xl">
                    🎯 Find Activities
                  </button>
                </a>

                <a href={links.dessert} target="_blank">
                  <button className="w-full bg-black text-white py-3 rounded-xl">
                    🍰 Dessert & Drinks
                  </button>
                </a>
              </div>
            )}

            {/* COPY BUTTON */}
            <button
              onClick={() => navigator.clipboard.writeText(plan)}
              className="mt-6 rounded-xl bg-black px-6 py-3 font-semibold text-white"
            >
              Copy Plan
            </button>
          </div>
        )}
      </div>
    </main>
  );
}