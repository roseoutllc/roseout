import { requireAdminRole } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export default async function AdminRestaurantsPage() {
  await requireAdminRole(["superuser", "admin", "editor", "viewer"]);

  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      {/* Header */}
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-500">
        RoseOut Admin
      </p>

      <h1 className="text-4xl font-extrabold tracking-tight">
        Restaurants Admin
      </h1>

      <p className="mt-3 text-neutral-400">
        View and manage all restaurant listings.
      </p>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-2xl bg-red-100 p-4 text-red-700">
          {error.message}
        </div>
      )}

      {/* Empty State */}
      {!restaurants?.length && !error && (
        <div className="mt-10 rounded-[2rem] bg-white p-8 text-center text-black">
          No restaurants found.
        </div>
      )}

      {/* Grid */}
      <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {restaurants?.map((restaurant) => (
          <a
            key={restaurant.id}
            href={`/admin/restaurants/${restaurant.id}`}
            className="overflow-hidden rounded-[2rem] bg-white text-black shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
          >
            {/* Image */}
            {restaurant.image_url ? (
              <img
                src={restaurant.image_url}
                alt={restaurant.restaurant_name}
                className="h-44 w-full object-cover"
              />
            ) : (
              <div className="flex h-44 items-center justify-center bg-neutral-200 text-neutral-500">
                No Image
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {/* Status */}
              <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
                {restaurant.status || "unknown"}
              </span>

              {/* Name */}
              <h2 className="mt-5 text-2xl font-extrabold">
                {restaurant.restaurant_name}
              </h2>

              {/* Location */}
              <p className="mt-2 text-sm text-neutral-600">
                {restaurant.city || "City"}, {restaurant.state || "State"}
              </p>

              {/* Meta */}
              <p className="mt-3 text-sm text-neutral-500">
                {restaurant.cuisine_type || "Cuisine N/A"} · Score:{" "}
                {restaurant.roseout_score || 0}
              </p>

              {/* Stats */}
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-neutral-100 px-3 py-1">
                  👁 {restaurant.view_count || 0}
                </span>

                <span className="rounded-full bg-neutral-100 px-3 py-1">
                  🖱 {restaurant.click_count || 0}
                </span>

                <span className="rounded-full bg-neutral-100 px-3 py-1">
                  ⭐ {restaurant.rating || 0}
                </span>
              </div>

              {/* CTA */}
              <div className="mt-6 inline-flex w-full justify-center rounded-full bg-black px-5 py-2 text-sm font-bold text-white">
                Edit Restaurant
              </div>
            </div>
          </a>
        ))}
      </section>
    </div>
  );
}