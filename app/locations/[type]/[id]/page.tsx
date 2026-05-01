"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { clampScore } from "@/lib/clampScore";
import ScoreBadge from "@/components/ScoreBadge";
import { trackActivity } from "@/lib/trackActivity";
import RoseOutHeader from "@/components/RoseOutHeader";
import LocationReviewForm from "@/components/LocationReviewForm";

function toArray(value: any): string[] {
  if (!value) return [];

  if (Array.isArray(value)) return value.map(String);

  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLocation = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Location fetch error:", error.message);
        setLocation(null);
        setReviews([]);
        setLoading(false);
        return;
      }

      const { data: reviewData } = await supabase
        .from("location_reviews")
        .select("*")
        .eq("location_id", id)
        .order("created_at", { ascending: false });

      setLocation(data);
      setReviews(reviewData || []);
      setLoading(false);
    };

    if (id) loadLocation();
  }, [id, supabase]);

  const isActivity =
    location?.location_type === "activity" ||
    type === "activities" ||
    type === "activity";

  const name =
    location?.restaurant_name ||
    location?.activity_name ||
    location?.name ||
    "RoseOut Location";

  const score = clampScore(
    location?.roseout_score ??
      location?.review_score ??
      location?.quality_score ??
      0
  );

  const address = [
    location?.address,
    location?.city,
    location?.state,
    location?.zip_code,
  ]
    .filter(Boolean)
    .join(", ");

  const reservationUrl =
    location?.reservation_url ||
    location?.reservation_link ||
    location?.booking_url ||
    "";

  const mapsUrl = useMemo(() => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${name} ${address}`
    )}`;
  }, [name, address]);

  const tags = toArray(location?.date_style_tags);
  const reviewKeywords = toArray(location?.review_keywords);
  const bestFor = toArray(location?.best_for);
  const specialFeatures = toArray(location?.special_features);
  const signatureItems = toArray(location?.signature_items);

  const baseMetadata = {
    location_id: id,
    location_type: location?.location_type || type,
    location_name: name,
  };

  const trackAndGoBack = () => {
    trackActivity({
      eventType: "navigation",
      eventName: "Back To Results",
      pagePath: window.location.pathname,
      metadata: {
        ...baseMetadata,
        source: "location_detail_page",
      },
    });

    router.push(from);
  };

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 text-white">
        <RoseOutHeader />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(225,6,42,0.3),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(127,29,29,0.35),transparent_28%),#000]" />

        <div className="relative z-10 rounded-[2rem] border border-white/10 bg-white/5 px-8 py-6 text-center shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">
            RoseOut
          </p>

          <p className="mt-3 text-sm font-bold text-white/70">
            Loading location...
          </p>
        </div>
      </main>
    );
  }

  if (!location) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 text-white">
        <RoseOutHeader />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(225,6,42,0.3),transparent_32%),#000]" />

        <div className="relative z-10 max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-7 text-center shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">
            RoseOut
          </p>

          <h1 className="mt-4 text-3xl font-black">Location Not Found</h1>

          <p className="mt-3 text-sm leading-6 text-white/60">
            This location could not be found in your unified locations table.
          </p>

          <button
            onClick={() => router.push(from)}
            className="mt-6 rounded-full bg-red-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500"
          >
            Back to Results
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative min-h-screen overflow-hidden">
        {location.image_url ? (
          <Image
            src={location.image_url}
            alt={name}
            fill
            priority
            className="object-cover opacity-45"
          />
        ) : (
          <div className="absolute inset-0 bg-black" />
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(225,6,42,0.34),transparent_34%),radial-gradient(circle_at_78%_8%,rgba(127,29,29,0.4),transparent_28%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/35" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-10 pt-5 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={trackAndGoBack}
              className="rounded-full border border-white/15 bg-black/55 px-4 py-2 text-sm font-bold text-white shadow-xl backdrop-blur-xl transition hover:bg-white hover:text-black"
            >
              ← Back
            </button>

            <span className="rounded-full border border-red-400/25 bg-red-950/40 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-red-100 shadow-xl backdrop-blur-xl">
              RoseOut Pick
            </span>
          </div>

          <div className="mt-auto grid items-end gap-8 pb-8 lg:grid-cols-[1fr_330px]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">
                RoseOut Location
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-black">
                  {isActivity
                    ? location.activity_type || "Activity"
                    : location.cuisine || "Restaurant"}
                </span>

                {location.price_range && (
                  <span className="rounded-full border border-white/15 bg-black/55 px-4 py-2 text-xs font-black uppercase tracking-wide text-white backdrop-blur-xl">
                    {location.price_range}
                  </span>
                )}

                <span className="rounded-full border border-white/15 bg-black/55 px-4 py-2 text-xs font-black uppercase tracking-wide text-white backdrop-blur-xl">
                  🌸 {location.review_count || reviews.length || 0} Reviews
                </span>
              </div>

              <h1 className="mt-5 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-8xl">
                {name}
              </h1>

              {location.primary_tag && (
                <p className="mt-5 text-xl font-black text-red-200">
                  ✨ {location.primary_tag}
                </p>
              )}

              {address && (
                <p className="mt-5 max-w-3xl text-sm font-semibold leading-6 text-white/75">
                  {address}
                </p>
              )}

              <p className="mt-6 max-w-3xl text-base leading-8 text-white/75 md:text-lg">
                {location.description ||
                  "A curated RoseOut location selected for memorable outings, quality experiences, and strong match potential."}
              </p>

              {reviewKeywords.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {reviewKeywords.slice(0, 6).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-black text-red-100"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                {reservationUrl && (
                  <a
                    href={reservationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-red-600 px-7 py-3 text-sm font-black text-white shadow-lg shadow-red-950/50 transition hover:bg-red-500"
                  >
                    {isActivity ? "Book Now" : "Reserve"}
                  </a>
                )}

                {location.website && (
                  <a
                    href={location.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
                  >
                    Website
                  </a>
                )}

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
                >
                  Directions
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 text-white shadow-2xl backdrop-blur-xl">
              <ScoreBadge score={score} />

              <p className="mt-4 text-sm leading-6 text-white/65">
                RoseOut uses location details, customer review words, vibe
                signals, and experience quality to improve recommendations.
              </p>

              {Number(location.review_score || 0) >= 85 && (
                <div className="mt-4 rounded-full bg-red-600 px-4 py-2 text-center text-xs font-black text-white shadow-lg shadow-red-950/40">
                  🌹 Review Favorite
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-black px-5 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(225,6,42,0.18),transparent_30%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <LuxuryCard
              eyebrow="Why RoseOut Recommends It"
              title="Built for better matches."
            >
              <p className="text-sm leading-7 text-white/60">
                {location.description ||
                  "This location includes signals that help RoseOut understand the vibe, atmosphere, and best use cases for customers searching in full sentences."}
              </p>

              {[...tags, ...reviewKeywords].length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {[...new Set([...tags, ...reviewKeywords])].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </LuxuryCard>

            {bestFor.length > 0 && (
              <DetailGrid title="Best For" items={bestFor} />
            )}

            {specialFeatures.length > 0 && (
              <DetailGrid title="Special Features" items={specialFeatures} />
            )}

            {signatureItems.length > 0 && (
              <DetailGrid title="Signature Picks" items={signatureItems} />
            )}

            <LuxuryCard
              eyebrow="Customer Reviews"
              title="What people are saying."
            >
              {reviews.length === 0 ? (
                <p className="text-sm leading-7 text-white/60">
                  No reviews yet. Be the first to leave a full-sentence review.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-black text-white">
                          {review.customer_name || "RoseOut Guest"}
                        </p>

                        <p className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                          🌸 {review.rating}/5
                        </p>
                      </div>

                      <p className="mt-3 text-sm leading-7 text-white/70">
                        {review.review_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </LuxuryCard>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
              <LocationReviewForm locationId={location.id} />
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <LuxuryCard
              eyebrow="Plan Your Visit"
              title={isActivity ? "Book the experience." : "Reserve the table."}
            >
              <div className="mt-6 grid gap-3">
                {reservationUrl && (
                  <a
                    href={reservationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-red-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-red-500"
                  >
                    {isActivity ? "Book Activity" : "Reserve Table"}
                  </a>
                )}

                {location.website && (
                  <a
                    href={location.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white hover:text-black"
                  >
                    Visit Website
                  </a>
                )}

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white hover:text-black"
                >
                  Get Directions
                </a>

                <button
                  onClick={trackAndGoBack}
                  className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white hover:text-black"
                >
                  Back to Results
                </button>
              </div>
            </LuxuryCard>

            <LuxuryCard
              eyebrow="Review Intelligence"
              title="Powered by real words."
            >
              <div className="mt-5 space-y-4 text-sm">
                <InfoRow label="Review Score" value={location.review_score || 0} />

                <InfoRow
                  label="Review Count"
                  value={location.review_count || reviews.length || 0}
                />

                <InfoRow
                  label="AI Keywords"
                  value={
                    reviewKeywords.length > 0
                      ? reviewKeywords.slice(0, 6).join(", ")
                      : "Not enough reviews yet"
                  }
                />
              </div>
            </LuxuryCard>
          </aside>
        </div>
      </section>
    </main>
  );
}

function LuxuryCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-white shadow-2xl backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-black tracking-tight">{title}</h2>

      <div className="mt-4">{children}</div>
    </section>
  );
}

function DetailGrid({ title, items }: { title: string; items: string[] }) {
  return (
    <LuxuryCard eyebrow={title} title={title}>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-white/70"
          >
            {item}
          </div>
        ))}
      </div>
    </LuxuryCard>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>

      <p className="mt-1 break-words font-bold text-white/80">{value}</p>
    </div>
  );
}