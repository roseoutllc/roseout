import { supabase } from "@/lib/supabase";
import BackButton from "./BackButton";
import { AnalyticsTracker, AnalyticsLink } from "./AnalyticsTracker";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RestaurantPage({ params }: PageProps) {
  const { id } = await params;

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error || !restaurant) {
    return (
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl">
          <BackButton />

          <div className="mt-8 rounded-3xl bg-white p-6 text-black">
            <h1 className="text-2xl font-bold">Restaurant Not Found</h1>
            <p className="mt-2 text-neutral-600">
              This restaurant may not be approved or available yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <AnalyticsTracker id={id} />

      <div className="mx-auto max-w-3xl">
        <BackButton />

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
            <h1 className="text-3xl font-bold">
              {restaurant.restaurant_name}
            </h1>

            <p className="mt-2 text-neutral-600">
              {restaurant.address}, {restaurant.city}, {restaurant.state}{" "}
              {restaurant.zip_code}
            </p>

            {restaurant.description && (
              <p className="mt-6 text-neutral-700">
                {restaurant.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {restaurant.reservation_link && (
                <AnalyticsLink
                  id={id}
                  href={restaurant.reservation_link}
                  className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"
                >
                  Reserve Table
                </AnalyticsLink>
              )}

              {restaurant.website && (
                <AnalyticsLink
                  id={id}
                  href={restaurant.website}
                  className="rounded-xl border border-black px-5 py-3 text-sm font-bold text-black"
                >
                  Visit Website
                </AnalyticsLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}