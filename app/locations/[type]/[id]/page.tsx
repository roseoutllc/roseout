"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import LocationReviewForm from "@/components/LocationReviewForm";

export default function LocationPage() {
  const supabase = createClient();
  const params = useParams();

  const id = String(params.id || "");

  const [location, setLocation] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: loc } = await supabase
        .from("locations")
        .select("*")
        .eq("id", id)
        .single();

      const { data: rev } = await supabase
        .from("location_reviews")
        .select("*")
        .eq("location_id", id)
        .order("created_at", { ascending: false });

      setLocation(loc);
      setReviews(rev || []);
    };

    if (id) load();
  }, [id, supabase]);

  if (!location) return null;

  return (
    <main className="min-h-screen bg-black text-white">

      {/* 🔥 HERO (MATCHES HOME PAGE) */}
      <section className="relative min-h-screen flex items-center px-6">

        {/* BACKGROUND */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#7f1d1d55,transparent_30%),radial-gradient(circle_at_80%_10%,#dc262655,transparent_25%),#000]" />

        {location.image_url && (
          <Image
            src={location.image_url}
            alt=""
            fill
            className="object-cover opacity-30"
          />
        )}

        <div className="relative z-10 max-w-6xl">

          <p className="text-xs tracking-[0.3em] text-red-400">
            ROSEOUT LOCATION
          </p>

          <h1 className="mt-4 text-5xl md:text-7xl font-bold">
            {location.name}
          </h1>

          <p className="mt-4 max-w-xl text-white/60 text-lg">
            {location.description ||
              "Curated for unforgettable experiences, tailored to your vibe."}
          </p>

          <div className="mt-6 flex gap-4">
            {location.reservation_url && (
              <a
                href={location.reservation_url}
                target="_blank"
                className="bg-red-600 px-6 py-3 rounded-full font-semibold hover:bg-red-500"
              >
                Reserve
              </a>
            )}

            <a
              href={`https://www.google.com/maps?q=${location.address}`}
              target="_blank"
              className="border border-white/20 px-6 py-3 rounded-full hover:bg-white hover:text-black"
            >
              Directions
            </a>
          </div>

          <div className="mt-6 text-sm text-white/50">
            🌸 {location.review_count || 0} reviews • Score {Math.round(location.review_score || 0)}
          </div>
        </div>
      </section>

      {/* 🔥 REVIEW KEYWORDS */}
      {location.review_keywords?.length > 0 && (
        <section className="px-6 mt-10 max-w-6xl mx-auto flex flex-wrap gap-2">
          {location.review_keywords.map((k: string) => (
            <span
              key={k}
              className="bg-white/10 px-3 py-1 rounded-full text-xs"
            >
              {k}
            </span>
          ))}
        </section>
      )}

      {/* 🔥 REVIEWS */}
      <section className="px-6 mt-16 max-w-6xl mx-auto">

        <h2 className="text-3xl font-bold">
          What people are saying
        </h2>

        <div className="mt-8 space-y-6">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur"
            >
              <div className="flex justify-between text-sm text-white/50">
                <span>{r.customer_name || "Guest"}</span>
                <span>🌸 {r.rating}/5</span>
              </div>

              <p className="mt-3 text-white">
                {r.review_text}
              </p>

              <div className="mt-4 flex gap-3 text-xs">
                {r.vibe && <span>🌹 {r.vibe}</span>}
                {r.noise_level && <span>🔊 {r.noise_level}</span>}
                {r.date_night && <span>❤️ Date Night</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🔥 REVIEW FORM */}
      <section className="px-6 mt-20 max-w-3xl mx-auto">
        <LocationReviewForm locationId={location.id} />
      </section>

      <div className="h-20" />
    </main>
  );
}