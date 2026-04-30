import { supabase } from "@/lib/supabase";
import { ActivityViewTracker, AnalyticsLink } from "./AnalyticsTracker";
import BackButton from "@/components/BackButton";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ActivityPage({ params }: PageProps) {
  const { id } = await params;

  const { data: activity, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("*")
    .eq("status", "approved")
    .order("roseout_score", { ascending: false })
    .limit(6);

  if (error || !activity) {
    return (
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl">
          <BackButton />

          <div className="mt-8 rounded-3xl bg-white p-6 text-black">
            <h1 className="text-2xl font-bold">Activity Not Found</h1>
            <p className="mt-2 text-neutral-600">
              This activity may not be approved or available yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <ActivityViewTracker id={id} />

      <div className="mx-auto max-w-5xl">
        <BackButton />

        <div className="mt-8 overflow-hidden rounded-3xl bg-white text-black shadow-xl">
          {activity.image_url ? (
            <img
              src={activity.image_url}
              alt={activity.activity_name}
              className="h-72 w-full object-cover"
            />
          ) : (
            <div className="flex h-72 items-center justify-center bg-neutral-200 text-neutral-500">
              No image available
            </div>
          )}

          <div className="p-6">
            <h1 className="text-3xl font-bold">
              {activity.activity_name || "Activity Location"}
            </h1>

            <p className="mt-2 text-neutral-600">
              {[activity.address, activity.city, activity.state, activity.zip_code]
                .filter(Boolean)
                .join(", ")}
            </p>

            {activity.description && (
              <p className="mt-6 text-neutral-700">{activity.description}</p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {activity.activity_type && (
                <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                  {activity.activity_type}
                </span>
              )}

              {activity.price_range && (
                <span className="rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-black">
                  {activity.price_range}
                </span>
              )}

              {activity.best_for && (
                <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-bold text-black">
                  {activity.best_for}
                </span>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {activity.booking_link && (
                <AnalyticsLink
                  id={id}
                  type="activity"
                  href={activity.booking_link}
                  className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"
                >
                  Book Activity
                </AnalyticsLink>
              )}

              {activity.website && (
                <AnalyticsLink
                  id={id}
                  type="activity"
                  href={activity.website}
                  className="rounded-xl border border-black px-5 py-3 text-sm font-bold text-black"
                >
                  Visit Website
                </AnalyticsLink>
              )}
            </div>
          </div>
        </div>

        {restaurants && restaurants.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-bold">Nearby Restaurants</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="overflow-hidden rounded-3xl bg-white text-black"
                >
                  {restaurant.image_url ? (
                    <img
                      src={restaurant.image_url}
                      alt={restaurant.restaurant_name}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-neutral-200 text-neutral-500">
                      No image
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="text-lg font-bold">
                      {restaurant.restaurant_name || "Restaurant"}
                    </h3>

                    <p className="mt-1 text-sm text-neutral-500">
                      {[restaurant.address, restaurant.city, restaurant.state]
                        .filter(Boolean)
                        .join(", ")}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={`/restaurants/${restaurant.id}`}
                        className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white"
                      >
                        View Restaurant
                      </a>

                      {restaurant.website && (
                        <AnalyticsLink
                          id={restaurant.id}
                          type="restaurant"
                          href={restaurant.website}
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