"use client";

import { useState } from "react";

export default function CreatePage() {
  const [request, setRequest] = useState("");
  const [plan, setPlan] = useState("");
  const [links, setLinks] = useState<any>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    try {
      setLoading(true);
      setPlan("");
      setLinks(null);
      setSelectedRestaurant(null);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ request }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPlan(`Error: ${data.error || "Something went wrong"}`);
        return;
      }

      setPlan(data.plan);
      setLinks(data.links);
      setSelectedRestaurant(data.selectedRestaurant);
    } catch (error) {
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

        {plan && (
          <div className="mt-8 rounded-3xl bg-white p-6 text-black">
            <h2 className="text-2xl font-bold">Your RoseOut Plan</h2>

            <p className="mt-4 whitespace-pre-line leading-8">{plan}</p>

            {selectedRestaurant && (
              <div className="mt-6 rounded-2xl border bg-neutral-50 p-4">
                <h3 className="text-xl font-bold">
                  Featured Restaurant: {selectedRestaurant.restaurant_name}
                </h3>

                <p className="mt-2 text-neutral-700">
                  {selectedRestaurant.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {selectedRestaurant.cuisine_type && (
                    <span className="rounded-full bg-black px-3 py-1 text-white">
                      {selectedRestaurant.cuisine_type}
                    </span>
                  )}

                  {selectedRestaurant.price_range && (
                    <span className="rounded-full bg-black px-3 py-1 text-white">
                      {selectedRestaurant.price_range}
                    </span>
                  )}

                  {selectedRestaurant.noise_level && (
                    <span className="rounded-full bg-black px-3 py-1 text-white">
                      {selectedRestaurant.noise_level}
                    </span>
                  )}

                  {selectedRestaurant.atmosphere && (
                    <span className="rounded-full bg-black px-3 py-1 text-white">
                      {selectedRestaurant.atmosphere}
                    </span>
                  )}
                </div>
              </div>
            )}

            {links && (
              <div className="mt-6 space-y-3">
                <a href={links.dinner} target="_blank">
                  <button className="w-full rounded-xl bg-black py-3 text-white">
                    🍽 Book{" "}
                    {selectedRestaurant?.restaurant_name || "Dinner"}
                  </button>
                </a>

                {links.phone && (
                  <a href={`tel:${links.phone}`}>
                    <button className="w-full rounded-xl bg-black py-3 text-white">
                      📞 Call Restaurant
                    </button>
                  </a>
                )}

                {links.website && (
                  <a href={links.website} target="_blank">
                    <button className="w-full rounded-xl bg-black py-3 text-white">
                      🌐 Visit Website
                    </button>
                  </a>
                )}

                <a href={links.activity} target="_blank">
                  <button className="w-full rounded-xl bg-black py-3 text-white">
                    🎯 Find Activities
                  </button>
                </a>

                <a href={links.dessert} target="_blank">
                  <button className="w-full rounded-xl bg-black py-3 text-white">
                    🍰 Dessert & Drinks
                  </button>
                </a>

                {links.instagram && (
                  <a href={links.instagram} target="_blank">
                    <button className="w-full rounded-xl bg-black py-3 text-white">
                      📸 Instagram
                    </button>
                  </a>
                )}

                {links.tiktok && (
                  <a href={links.tiktok} target="_blank">
                    <button className="w-full rounded-xl bg-black py-3 text-white">
                      🎵 TikTok
                    </button>
                  </a>
                )}

                {links.x && (
                  <a href={links.x} target="_blank">
                    <button className="w-full rounded-xl bg-black py-3 text-white">
                      ✕ X
                    </button>
                  </a>
                )}
              </div>
            )}

            <button
              onClick={() => navigator.clipboard.writeText(plan)}
              className="mt-6 rounded-xl bg-yellow-500 px-6 py-3 font-semibold text-black"
            >
              Copy Plan
            </button>
          </div>
        )}
      </div>
    </main>
  );
}