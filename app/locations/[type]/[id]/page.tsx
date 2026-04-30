import Image from "next/image";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "./BackButton";

type PageProps = {
  params: Promise<{
    type: "restaurants" | "activities";
    id: string;
  }>;
};

export default async function LocationDetailPage({ params }: PageProps) {
  const { type, id } = await params;

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

  const image = item.image_url || item.photo_url || item.image || "";

  const address = [item.address, item.city, item.state, item.zip_code]
    .filter(Boolean)
    .join(", ");

  const rating = item.rating || null;
  const reviews = item.review_count || null;

  const score = Math.min(Number(item.roseout_score || 0), 100);

  const reservationUrl =
    item.reservation_url || item.reservation_link || item.booking_url || "";

  const website = item.website || item.website_url || "";

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} ${address}`
  )}`;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="relative min-h-[70vh] overflow-hidden">
        {image ? (
          <Image src={image} alt={name} fill priority className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />

        <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-between px-5 py-8">
          <BackButton />

          <div className="max-w-3xl pb-8">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-yellow-500 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-black">
                RoseOut Pick
              </span>

              <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white backdrop-blur">
                {isActivity ? "Activity" : "Restaurant"}
              </span>
            </div>

            <h1 className="text-5xl font-black tracking-tight md:text-7xl">
              {name}
            </h1>

            <p className="mt-4 max-w-2xl text-lg font-medium text-neutral-200">
              {category}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-bold text-white">
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

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-black shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-600">
              Why RoseOut picked this
            </p>

            <h2 className="mt-3 text-3xl font-extrabold">
              {item.primary_tag || "A strong match for your outing"}
            </h2>

            <p className="mt-4 leading-7 text-neutral-700">
              {item.description ||
                `${name} is a curated RoseOut match based on atmosphere, location, rating, and date-night fit.`}
            </p>

            {item.date_style_tags?.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {item.date_style_tags.slice(0, 8).map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#111] p-6">
            <h2 className="text-2xl font-extrabold">Details</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {category && (
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Category
                  </p>
                  <p className="mt-1 font-bold">{category}</p>
                </div>
              )}

              {item.price_level && (
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Price
                  </p>
                  <p className="mt-1 font-bold">{item.price_level}</p>
                </div>
              )}

              {item.price_range && (
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Price Range
                  </p>
                  <p className="mt-1 font-bold">{item.price_range}</p>
                </div>
              )}

              {item.phone && (
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Phone
                  </p>
                  <p className="mt-1 font-bold">{item.phone}</p>
                </div>
              )}

              {address && (
                <div className="rounded-2xl bg-white/5 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Address
                  </p>
                  <p className="mt-1 font-bold">{address}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-black shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">
              RoseOut Match
            </p>

            <div className="mt-3 flex items-end justify-between">
              <p className="text-5xl font-black">{score}</p>
              <p className="pb-2 text-sm font-bold text-neutral-500">/100</p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-yellow-500"
                style={{ width: `${score}%` }}
              />
            </div>

            <div className="mt-6 grid gap-3">
              {reservationUrl && (
                <a
                  href={reservationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-black px-5 py-3 text-center text-sm font-extrabold text-white"
                >
                  {isActivity ? "Book Now" : "Reserve a Table"}
                </a>
              )}

              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-black px-5 py-3 text-center text-sm font-bold text-black"
                >
                  Visit Website
                </a>
              )}

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-black px-5 py-3 text-center text-sm font-bold text-black"
              >
                Get Directions
              </a>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}