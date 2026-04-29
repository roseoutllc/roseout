import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function RestaurantPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !restaurant) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/create"
          className="text-sm font-semibold text-yellow-500"
        >
          ← Back to RoseOut
        </Link>

        <div className="mt-8 overflow-hidden rounded-3xl bg-white text-black shadow-xl">
          {restaurant.image_url ? (
            <img
              src={restaurant.image_url}
              alt={restaurant.restaurant_name}
              className="h-72 w-full object-cover"
            />
          ) : (
            <div className="flex h-72 items-center justify-center bg-neutral-200 text-neutral-500">
              No image available
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {restaurant.restaurant_name}
                </h1>

                <p className="mt-2 text-neutral-600">
                  {restaurant.address}, {restaurant.city},{" "}
                  {restaurant.state} {restaurant.zip_code}
                </p>
              </div>

              <span className="rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black">
                RoseOut Score: {restaurant.roseout_score}
              </span>
            </div>

            {restaurant.description && (
              <p className="mt-6 text-neutral-700">
                {restaurant.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {restaurant.reservation_link && (
                <a
                  href={restaurant.reservation_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"
                >
                  Reserve Table
                </a>
              )}

              {restaurant.website && (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-black px-5 py-3 text-sm font-bold text-black"
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}