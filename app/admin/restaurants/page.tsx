import { requireAdminRole } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

type SearchParams = {
  q?: string;
  status?: string;
  page?: string;
};

export default async function AdminRestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminRole(["superuser", "admin", "editor", "viewer"]);

  const params = await searchParams;

  const q = params.q || "";
  const status = params.status || "all";
  const page = Number(params.page || 1);
  const pageSize = 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Main filtered/paginated query
  let query = supabase
    .from("restaurants")
    .select(
      "id, restaurant_name, city, state, status, claimed, cuisine_type, rating, view_count, click_count, roseout_score, image_url, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (q) {
    query = query.or(
      `restaurant_name.ilike.%${q}%,city.ilike.%${q}%,cuisine_type.ilike.%${q}%`
    );
  }

  const { data: restaurants, error, count } = await query;

  // Full database counts
  const { count: totalRestaurants } = await supabase
    .from("restaurants")
    .select("id", { count: "exact", head: true });

  const { count: claimedRestaurants } = await supabase
    .from("restaurants")
    .select("id", { count: "exact", head: true })
    .eq("claimed", true);

  const { count: unclaimedRestaurants } = await supabase
    .from("restaurants")
    .select("id", { count: "exact", head: true })
    .or("claimed.eq.false,claimed.is.null");

  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  const statusUrl = (newStatus: string) =>
    `/admin/restaurants?q=${encodeURIComponent(q)}&status=${newStatus}&page=1`;

  const pageUrl = (newPage: number) =>
    `/admin/restaurants?q=${encodeURIComponent(q)}&status=${status}&page=${newPage}`;

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-500">
          RoseOut Admin
        </p>

        <h1 className="text-4xl font-extrabold tracking-tight">
          Restaurants Admin
        </h1>

        <p className="mt-3 text-neutral-400">
          Manage large restaurant inventory with search, filters, claim status,
          stats, and fast editing.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-100 p-4 text-red-700">
          {error.message}
        </div>
      )}

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 text-black">
          <p className="text-xs font-bold uppercase text-neutral-500">
            Total Restaurants
          </p>
          <p className="mt-1 text-3xl font-extrabold">
            {totalRestaurants || 0}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 text-black">
          <p className="text-xs font-bold uppercase text-neutral-500">
            Claimed
          </p>
          <p className="mt-1 text-3xl font-extrabold">
            {claimedRestaurants || 0}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 text-black">
          <p className="text-xs font-bold uppercase text-neutral-500">
            Unclaimed
          </p>
          <p className="mt-1 text-3xl font-extrabold">
            {unclaimedRestaurants || 0}
          </p>
        </div>
      </section>

      <section className="mb-6 rounded-[2rem] bg-white p-5 text-black shadow-xl">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_140px]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by restaurant, city, or cuisine..."
            className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
          />

          <select
            name="status"
            defaultValue={status}
            className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
          </select>

          <input type="hidden" name="page" value="1" />

          <button
            type="submit"
            className="rounded-full bg-yellow-500 px-5 py-3 font-extrabold text-black"
          >
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {["all", "approved", "pending", "draft", "rejected"].map((item) => (
            <a
              key={item}
              href={statusUrl(item)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${
                status === item
                  ? "bg-black text-white"
                  : "bg-neutral-100 text-neutral-700"
              }`}
            >
              {item}
            </a>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-white text-black shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Restaurant Listings</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Click any row to edit the restaurant.
            </p>
          </div>

          <div className="text-sm font-bold text-neutral-500">
            Showing {from + 1}-{Math.min(to + 1, count || 0)} of {count || 0}
          </div>
        </div>

        {!restaurants?.length ? (
          <div className="p-8 text-center text-neutral-500">
            No restaurants found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-5 py-4">Restaurant</th>
                  <th className="px-5 py-4">City</th>
                  <th className="px-5 py-4">Cuisine</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Claim</th>
                  <th className="px-5 py-4">Rating</th>
                  <th className="px-5 py-4">Views</th>
                  <th className="px-5 py-4">Clicks</th>
                  <th className="px-5 py-4">Score</th>
                  <th className="px-5 py-4">Edit</th>
                </tr>
              </thead>

              <tbody>
                {restaurants.map((restaurant) => (
                  <tr
                    key={restaurant.id}
                    className="border-t border-neutral-200 hover:bg-yellow-50"
                  >
                    <td className="px-5 py-4">
                      <a
                        href={`/admin/restaurants/${restaurant.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="h-12 w-12 overflow-hidden rounded-xl bg-neutral-200">
                          {restaurant.image_url ? (
                            <img
                              src={restaurant.image_url}
                              alt={restaurant.restaurant_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                              —
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-extrabold">
                            {restaurant.restaurant_name}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {restaurant.state || "N/A"}
                          </p>
                        </div>
                      </a>
                    </td>

                    <td className="px-5 py-4">{restaurant.city || "N/A"}</td>

                    <td className="px-5 py-4">
                      {restaurant.cuisine_type || "N/A"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
                        {restaurant.status || "unknown"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                          restaurant.claimed
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {restaurant.claimed ? "Claimed" : "Unclaimed"}
                      </span>
                    </td>

                    <td className="px-5 py-4">⭐ {restaurant.rating || 0}</td>

                    <td className="px-5 py-4">{restaurant.view_count || 0}</td>

                    <td className="px-5 py-4">{restaurant.click_count || 0}</td>

                    <td className="px-5 py-4 font-bold">
                      {restaurant.roseout_score || 0}
                    </td>

                    <td className="px-5 py-4">
                      <a
                        href={`/admin/restaurants/${restaurant.id}`}
                        className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white"
                      >
                        Edit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-6 flex items-center justify-between">
        <a
          href={pageUrl(Math.max(1, page - 1))}
          className={`rounded-full px-5 py-3 font-bold ${
            page <= 1
              ? "pointer-events-none bg-white/10 text-neutral-500"
              : "bg-white text-black"
          }`}
        >
          Previous
        </a>

        <p className="text-sm text-neutral-400">
          Page {page} of {totalPages}
        </p>

        <a
          href={pageUrl(Math.min(totalPages, page + 1))}
          className={`rounded-full px-5 py-3 font-bold ${
            page >= totalPages
              ? "pointer-events-none bg-white/10 text-neutral-500"
              : "bg-yellow-500 text-black"
          }`}
        >
          Next
        </a>
      </div>
    </div>
  );
}