import { supabase } from "@/lib/supabase";
import BackButton from "./BackButton";
import {
  RestaurantViewTracker,
  AnalyticsLink,
  ActivityImpressionTracker,
} from "./AnalyticsTracker";

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

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("status", "approved")
    .limit(6);

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
      <RestaurantViewTracker id={id} />
      <ActivityImpressionTracker activities={activities || []} />

      <div className="mx-auto max-w-5xl">
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
                  type="restaurant"
                  href={restaurant.reservation_link}
                  className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"
                >
                  Reserve Table
                </AnalyticsLink>
              )}

              {restaurant.website && (
                <AnalyticsLink
                  id={id}
                  type="restaurant"
                  href={restaurant.website}
                  className="rounded-xl border border-black px-5 py-3 text-sm font-bold text-black"
                >
                  Visit Website
                </AnalyticsLink>
              )}
            </div>
          </div>
        </div>

        {activities && activities.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-bold">Nearby Activity Locations</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="overflow-hidden rounded-3xl bg-white text-black"
                >
                  {activity.image_url ? (
                    <img
                      src={activity.image_url}
                      alt={activity.activity_name}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-neutral-200 text-neutral-500">
                      No image
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="text-lg font-bold">
                      {activity.activity_name || "Activity Location"}
                    </h3>

                    <p className="mt-1 text-sm text-neutral-500">
                      {[activity.address, activity.city, activity.state]
                        .filter(Boolean)
                        .join(", ")}
                    </p>

                    {activity.description && (
                      <p className="mt-3 line-clamp-3 text-sm text-neutral-700">
                        {activity.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {activity.booking_link && (
                        <AnalyticsLink
                          id={activity.id}
                          type="activity"
                          href={activity.booking_link}
                          className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white"
                        >
                          Book Activity
                        </AnalyticsLink>
                      )}

                      {activity.website && (
                        <AnalyticsLink
                          id={activity.id}
                          type="activity"
                          href={activity.website}
                          className="rounded-xl border border-black px-4 py-2 text-sm font-bold text-black"
                        >
                          Website
                        </AnalyticsLink>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}