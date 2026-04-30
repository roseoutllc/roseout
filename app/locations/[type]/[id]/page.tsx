import Image from "next/image";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "./BackButton";

type PageProps = {
  params: Promise<{
    type: "restaurants" | "activities";
    id: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
};

export default async function LocationDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { type, id } = await params;
  const { from } = await searchParams;

  const table = type === "activities" ? "activities" : "restaurants";

  const { data: item, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    notFound();
  }

  const isActivity = type === "activities";

  const name =
    item.restaurant_name ||
    item.activity_name ||
    item.name ||
    "RoseOut Location";

  const category =
    item.cuisine ||
    item.activity_type ||
    item.primary_tag ||
    "Curated Experience";

  const image = item.image_url || "";

  const address = [item.address, item.city, item.state, item.zip_code]
    .filter(Boolean)
    .join(", ");

  const rating = item.rating || null;
  const reviews = item.review_count || null;

  const score = Math.min(Number(item.roseout_score || 0), 100);

  const reservationUrl =
    item.reservation_url || item.reservation_link || "";

  const website = item.website || "";

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} ${address}`
  )}`;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* HERO */}
      <section className="relative min-h-[70vh] overflow-hidden">
        {image ? (
          <Image src={image} alt={name} fill priority className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

        <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-between px-5 py-8">
          {/* 🔥 FIXED BACK BUTTON */}
          <BackButton fallback={from || "/create"} />

          <div className="max-w-3xl pb-8">
            <div className="mb-4 flex gap-2">
              <span className="rounded-full bg-yellow-500 px-4 py-1.5 text-xs font-extrabold text-black">
                RoseOut Pick
              </span>

              <span className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold backdrop-blur">
                {isActivity ? "Activity" : "Restaurant"}
              </span>
            </div>

            <h1 className="text-5xl font-black md:text-7xl">{name}</h1>

            <p className="mt-3 text-lg text-neutral-200">{category}</p>

            <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold">
              {rating && (
                <span>
                  ⭐ {rating}
                  {reviews ? ` (${reviews} reviews)` : ""}
                </span>
              )}
              {address && <span>{address}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1fr_360px]">
        {/* LEFT */}
        <div className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 text-black shadow-2xl">
            <p className="text-xs font-bold uppercase text-yellow-600">
              Why RoseOut picked this
            </p>

            <h2 className="mt-3 text-3xl font-extrabold">
              {item.primary_tag || "Perfect match"}
            </h2>

            <p className="mt-4 text-neutral-700">
              {item.description ||
                "Carefully selected based on your preferences."}
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <aside>
          <div className="rounded-[2rem] bg-white p-6 text-black shadow-2xl">
            <p className="text-xs uppercase text-neutral-500">
              RoseOut Match
            </p>

            <div className="mt-3 flex items-end justify-between">
              <p className="text-5xl font-black">{score}</p>
              <span>/100</span>
            </div>

            <div className="mt-4 h-3 bg-neutral-200 rounded-full">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${score}%` }}
              />
            </div>

            <div className="mt-6 space-y-3">
              {reservationUrl && (
                <a
                  href={reservationUrl}
                  target="_blank"
                  className="block rounded-full bg-black py-3 text-center text-white font-bold"
                >
                  {isActivity ? "Book Now" : "Reserve"}
                </a>
              )}

              {website && (
                <a
                  href={website}
                  target="_blank"
                  className="block rounded-full border py-3 text-center font-bold"
                >
                  Website
                </a>
              )}

              <a
                href={mapsUrl}
                target="_blank"
                className="block rounded-full border py-3 text-center font-bold"
              >
                Directions
              </a>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}