import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{
    type: "restaurants" | "activities";
    id: string;
  }>;
};

export default async function LocationDetailPage({ params }: PageProps) {
  const { type, id } = await params;

  const table = type === "activities" ? "activities" : "restaurants";

  const { data: location, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (error || !location) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-md text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-500">
            RoseOut
          </p>

          <h1 className="mt-4 text-3xl font-extrabold">
            Location Not Found
          </h1>

          <p className="mt-3 text-neutral-400">
            This location could not be loaded. It may have been removed or the
            link may be incorrect.
          </p>

          <Link
            href="/create"
            className="mt-6 inline-block rounded-full bg-yellow-500 px-6 py-3 font-bold text-black"
          >
            Back to RoseOut
          </Link>
        </div>
      </main>
    );
  }

  const name =
    location.restaurant_name ||
    location.activity_name ||
    location.name ||
    "RoseOut Location";

  const image =
    location.image_url ||
    location.photo_url ||
    location.image ||
    "";

  const address = [
    location.address,
    location.city,
    location.state,
    location.zip_code,
  ]
    .filter(Boolean)
    .join(", ");

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} ${address}`
  )}`;

  const reservationUrl =
    location.reservation_url ||
    location.reservation_link ||
    location.booking_url ||
    "";

  const website = location.website || location.website_url || "";

  const rating = location.rating || location.roseout_score || "";

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/create"
          className="mb-6 inline-block text-sm font-semibold text-yellow-500"
        >
          ← Back to results
        </Link>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white text-black shadow-2xl">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="min-h-[320px] bg-neutral-200">
              {image ? (
                <img
                  src={image}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center text-neutral-500">
                  No image available
                </div>
              )}
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-600">
                {type === "activities" ? "Activity" : "Restaurant"}
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
                {name}
              </h1>

              {location.primary_tag && (
                <p className="mt-3 text-lg font-bold">
                  ✨ {location.primary_tag}
                </p>
              )}

              {address && (
                <p className="mt-4 text-sm leading-6 text-neutral-600">
                  {address}
                </p>
              )}

              {rating && (
                <p className="mt-4 text-sm font-bold text-neutral-800">
                  ⭐ {rating}
                  {location.review_count
                    ? ` (${location.review_count} reviews)`
                    : ""}
                </p>
              )}

              {location.price_level && (
                <p className="mt-2 text-sm font-semibold text-neutral-700">
                  Price Level: {location.price_level}
                </p>
              )}

              {location.cuisine && (
                <p className="mt-2 text-sm text-neutral-600">
                  Cuisine: {location.cuisine}
                </p>
              )}

              {location.activity_type && (
                <p className="mt-2 text-sm text-neutral-600">
                  Type: {location.activity_type}
                </p>
              )}

              {location.description && (
                <p className="mt-5 text-sm leading-6 text-neutral-700">
                  {location.description}
                </p>
              )}

              <div className="mt-6 grid gap-3">
                {reservationUrl && (
                  <a
                    href={reservationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-black px-5 py-3 text-center text-sm font-bold text-white"
                  >
                    {type === "activities" ? "Book Activity" : "Reserve Dinner"}
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
          </div>

          <div className="border-t border-neutral-200 bg-neutral-50 p-6">
            <h2 className="text-lg font-extrabold">More Details</h2>

            <div className="mt-4 grid gap-4 text-sm text-neutral-700 md:grid-cols-2">
              {location.phone && (
                <p>
                  <span className="font-bold text-black">Phone:</span>{" "}
                  {location.phone}
                </p>
              )}

              {location.city && (
                <p>
                  <span className="font-bold text-black">City:</span>{" "}
                  {location.city}
                </p>
              )}

              {location.state && (
                <p>
                  <span className="font-bold text-black">State:</span>{" "}
                  {location.state}
                </p>
              )}

              {location.status && (
                <p>
                  <span className="font-bold text-black">Status:</span>{" "}
                  {location.status}
                </p>
              )}

              {location.date_style_tags?.length ? (
                <p className="md:col-span-2">
                  <span className="font-bold text-black">Best For:</span>{" "}
                  {location.date_style_tags.join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}