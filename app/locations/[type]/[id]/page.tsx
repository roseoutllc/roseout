"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { clampScore } from "@/lib/clampScore";
import ScoreBadge from "@/components/ScoreBadge";
import BackButton from "@/components/BackButton";

function toArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

export default function LocationDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = String(params.type || "");
  const id = String(params.id || "");
  const from = searchParams.get("from") || "/create";

  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isActivity = type === "activities" || type === "activity";
  const table = isActivity ? "activities" : "restaurants";

  useEffect(() => {
    const loadLocation = async () => {
      setLoading(true);

      const { data } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      setLocation(data || null);
      setLoading(false);
    };

    if (id) loadLocation();
  }, [id, table, supabase]);

  const name =
    location?.restaurant_name ||
    location?.activity_name ||
    location?.name ||
    "RoseOut Location";

  const score = clampScore(location?.roseout_score ?? location?.quality_score ?? 0);

  const address = [
    location?.address,
    location?.city,
    location?.state,
    location?.zip_code,
  ]
    .filter(Boolean)
    .join(", ");

  const reservationUrl =
    location?.reservation_url || location?.reservation_link || "";

  const mapsUrl = useMemo(() => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${name} ${address}`
    )}`;
  }, [name, address]);

  const tags = toArray(location?.date_style_tags);
  const bestFor = toArray(location?.best_for);
  const specialFeatures = toArray(location?.special_features);
  const signatureItems = toArray(location?.signature_items);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-500">
          Loading Location...
        </p>
      </main>
    );
  }

  if (!location) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="max-w-md rounded-[2rem] border border-white/10 bg-[#111] p-6 text-center shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-500">
            RoseOut
          </p>
          <h1 className="mt-3 text-3xl font-black">Location Not Found</h1>
          <p className="mt-3 text-sm text-neutral-400">
            This listing may have been removed or is no longer available.
          </p>
          <button
            onClick={() => router.push(from)}
            className="mt-6 rounded-full bg-yellow-500 px-6 py-3 text-sm font-black text-black"
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative min-h-[78vh] overflow-hidden">
        {location.image_url ? (
          <Image
            src={location.image_url}
            alt={name}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/20" />

        <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-between px-5 py-6">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => router.push(from)}
              className="rounded-full border border-white/15 bg-black/65 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white hover:text-black"
            >
              ← Back
            </button>

            <span className="rounded-full bg-yellow-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-black">
              RoseOut Pick
            </span>
          </div>

          <div className="grid items-end gap-6 pb-8 lg:grid-cols-[1fr_280px]">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-black">
                  {isActivity
                    ? location.activity_type || "Activity"
                    : location.cuisine || "Restaurant"}
                </span>

                {location.price_range && (
                  <span className="rounded-full bg-black/70 px-4 py-2 text-xs font-black uppercase tracking-wide text-white backdrop-blur">
                    {location.price_range}
                  </span>
                )}

                {location.rating && (
                  <span className="rounded-full bg-black/70 px-4 py-2 text-xs font-black uppercase tracking-wide text-white backdrop-blur">
                    ⭐ {location.rating}
                    {location.review_count ? ` (${location.review_count})` : ""}
                  </span>
                )}
              </div>

              <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
                {name}
              </h1>

              {location.primary_tag && (
                <p className="mt-4 text-xl font-black text-yellow-400">
                  ✨ {location.primary_tag}
                </p>
              )}

              {address && (
                <p className="mt-4 max-w-2xl text-sm font-semibold text-neutral-200">
                  {address}
                </p>
              )}

              <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-200 md:text-lg">
                {location.description ||
                  "A curated RoseOut location selected for memorable outings, quality experiences, and strong match potential."}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {reservationUrl && (
                  <a
                    href={reservationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-yellow-500 px-7 py-3 text-sm font-black text-black transition hover:bg-yellow-400"
                  >
                    {isActivity ? "Book Now" : "Reserve"}
                  </a>
                )}

                {location.website && (
                  <a
                    href={location.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white hover:text-black"
                  >
                    Website
                  </a>
                )}

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white hover:text-black"
                >
                  Directions
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white/95 p-5 text-black shadow-2xl backdrop-blur">
              <ScoreBadge score={score} />

              <p className="mt-4 text-sm leading-6 text-neutral-600">
                RoseOut ranks this location based on match quality, profile
                details, tags, and experience signals.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-black via-[#15110d] to-[#d8c5a8] px-5 py-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-[2rem] bg-white p-6 text-black shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
                Why RoseOut Recommends It
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Built for better matches.
              </h2>

              <p className="mt-4 text-sm leading-7 text-neutral-600">
                {location.description ||
                  "This location includes signals that help RoseOut understand the vibe, atmosphere, and best use cases for customers searching in full sentences."}
              </p>

              {tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <InfoCard title="Atmosphere" value={location.atmosphere || "Not listed"} />
              <InfoCard title="Noise Level" value={location.noise_level || "Not listed"} />
              <InfoCard title="Dress Code" value={location.dress_code || "Not listed"} />
              <InfoCard title="Parking" value={location.parking_info || "Not listed"} />
            </section>

            {bestFor.length > 0 && <ListSection title="Best For" items={bestFor} />}
            {specialFeatures.length > 0 && (
              <ListSection title="Special Features" items={specialFeatures} />
            )}
            {signatureItems.length > 0 && (
              <ListSection
                title={isActivity ? "Experience Highlights" : "Signature Items"}
                items={signatureItems}
              />
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-[2rem] bg-white p-6 text-black shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
                Quick Details
              </p>

              <div className="mt-5 space-y-4 text-sm">
                <DetailRow label="Type" value={isActivity ? "Activity" : "Restaurant"} />
                <DetailRow label="City" value={location.city || "Not listed"} />
                <DetailRow label="Neighborhood" value={location.neighborhood || "Not listed"} />
                <DetailRow label="Price" value={location.price_range || "Not listed"} />
                <DetailRow label="Hours" value={location.hours || "Not listed"} />
                <DetailRow label="Phone" value={location.phone || "Not listed"} />

                {!isActivity && (
                  <DetailRow label="Cuisine" value={location.cuisine || "Not listed"} />
                )}

                {isActivity && (
                  <DetailRow
                    label="Activity Type"
                    value={location.activity_type || "Not listed"}
                  />
                )}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 text-black shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
                Plan Your Visit
              </p>

              <div className="mt-5 grid gap-3">
                {reservationUrl && (
                  <a
                    href={reservationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-black px-5 py-3 text-center text-sm font-black text-white"
                  >
                    {isActivity ? "Book Activity" : "Reserve Table"}
                  </a>
                )}

                {location.website && (
                  <a
                    href={location.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-black px-5 py-3 text-center text-sm font-black text-black"
                  >
                    Visit Website
                  </a>
                )}

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-black px-5 py-3 text-center text-sm font-black text-black"
                >
                  Get Directions
                </a>

                <button
                  onClick={() => router.push(from)}
                  className="rounded-full border border-black px-5 py-3 text-center text-sm font-black text-black"
                >
                  Back to Results
                </button>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[2rem] bg-white p-6 text-black shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
        {title}
      </p>
      <p className="mt-3 text-lg font-black">{value}</p>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-[2rem] bg-white p-6 text-black shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
        {title}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm font-bold text-neutral-700"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-200 pb-3">
      <span className="font-bold text-neutral-500">{label}</span>
      <span className="text-right font-black">{value}</span>
    </div>
  );
}