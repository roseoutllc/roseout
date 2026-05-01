"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { clampScore } from "@/lib/clampScore";

export default function LocationDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const type = params.type as string;
  const id = params.id as string;
  const from = searchParams.get("from");

  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const table = type === "activities" ? "activities" : "restaurants";

      const { data } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();

      setLocation(data);
      setLoading(false);
    };

    load();
  }, [id, type, supabase]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  if (!location) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Not found
      </main>
    );
  }

  const name =
    location.restaurant_name || location.activity_name || "Location";

  const score = clampScore(
    location.roseout_score ?? location.quality_score ?? 0
  );

  return (
    <main className="min-h-screen bg-black text-white px-5 py-6">
      <div className="mx-auto max-w-4xl">

        {/* BACK BUTTON */}
        <button
          onClick={() => router.push(from || "/create")}
          className="mb-4 rounded-full border border-white/20 px-4 py-2 text-sm"
        >
          ← Back
        </button>

        {/* IMAGE */}
        {location.image_url && (
          <Image
            src={location.image_url}
            alt={name}
            width={1000}
            height={600}
            className="rounded-2xl mb-6 object-cover w-full h-[350px]"
          />
        )}

        {/* NAME */}
        <h1 className="text-4xl font-black">{name}</h1>

        {/* SCORE */}
        <p className="mt-2 text-yellow-400 font-bold text-lg">
          {score}/100 Match
        </p>

        {/* ADDRESS */}
        <p className="mt-3 text-neutral-300">
          {[location.address, location.city, location.state]
            .filter(Boolean)
            .join(", ")}
        </p>

        {/* TAG */}
        {location.primary_tag && (
          <p className="mt-4 text-lg font-bold">
            ✨ {location.primary_tag}
          </p>
        )}

        {/* DESCRIPTION */}
        {location.description && (
          <p className="mt-6 text-neutral-300 leading-7">
            {location.description}
          </p>
        )}

        {/* TAGS */}
        {location.date_style_tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {location.date_style_tags.map((tag: string) => (
              <span
                key={tag}
                className="bg-white/10 px-3 py-1 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* BUTTONS */}
        <div className="mt-8 flex flex-wrap gap-3">

          {(location.reservation_url || location.reservation_link) && (
            <a
              href={
                location.reservation_url || location.reservation_link
              }
              target="_blank"
              className="bg-yellow-500 text-black px-5 py-3 rounded-full font-bold"
            >
              Reserve
            </a>
          )}

          {location.website && (
            <a
              href={location.website}
              target="_blank"
              className="border border-white/20 px-5 py-3 rounded-full font-bold"
            >
              Website
            </a>
          )}
        </div>
      </div>
    </main>
  );
}