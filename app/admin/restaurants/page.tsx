import Link from "next/link";
import { requireAdminRole } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

type SearchParams = {
  q?: string;
  status?: string;
  page?: string;
};

function formatNumber(value: number | null | undefined) {
  return Number(value || 0).toLocaleString();
}

function statusBadge(status?: string | null) {
  const value = status || "unknown";

  if (value === "approved") return "border-rose-200 bg-rose-50 text-rose-700";
  if (value === "pending") return "border-amber-200 bg-amber-50 text-amber-700";
  if (value === "rejected") return "border-red-200 bg-red-50 text-red-700";
  if (value === "draft") return "border-neutral-200 bg-neutral-100 text-neutral-700";

  return "border-neutral-200 bg-neutral-100 text-neutral-600";
}

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

  let query = supabase
    .from("restaurants")
    .select(
      "id, restaurant_name, city, state, status, claimed, cuisine_type, rating, view_count, click_count, roseout_score, image_url, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") query = query.eq("status", status);

  if (q) {
    query = query.or(
      `restaurant_name.ilike.%${q}%,city.ilike.%${q}%,cuisine_type.ilike.%${q}%`
    );
  }

  const { data: restaurants, error, count } = await query;

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
    <main className="min-h-screen bg-[#090706] px-4 pb-10 pt-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(225,29,72,0.22),transparent_35%),linear-gradient(135deg,#160b0b,#090706_55%,#140f0a)] p-5 shadow-2xl sm:p-6">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-rose-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-rose-300">
                RoseOut Admin
              </p>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Restaurants Admin
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                Manage restaurant inventory, claim status, performance,
                approval status, and quick listing edits.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                Locations
              </p>
              <p className="mt-1 text-3xl font-black">{formatNumber(count)}</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm font-bold text-rose-100">
            {error.message}
          </div>
        )}

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
              Total Locations
            </p>
            <p className="mt-2 text-3xl font-black">
              {formatNumber(totalRestaurants)}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
              Claimed
            </p>
            <p className="mt-2 text-3xl font-black text-rose-200">
              {formatNumber(claimedRestaurants)}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
              Unclaimed
            </p>
            <p className="mt-2 text-3xl font-black text-white">
              {formatNumber(unclaimedRestaurants)}
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-[1.75rem] border border-white/10 bg-[#120d0b] p-4 shadow-2xl">
          <form className="grid gap-3 md:grid-cols-[1fr_200px_120px]">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search restaurant, city, or cuisine..."
              className="h-11 rounded-full border border-white/10 bg-white/[0.07] px-5 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-rose-300"
            />

            <select
              name="status"
              defaultValue={status}
              className="h-11 rounded-full border border-white/10 bg-white/[0.07] px-5 text-sm font-bold text-white outline-none focus:border-rose-300"
            >
              <option className="text-black" value="all">All Statuses</option>
              <option className="text-black" value="approved">Approved</option>
              <option className="text-black" value="pending">Pending</option>
              <option className="text-black" value="draft">Draft</option>
              <option className="text-black" value="rejected">Rejected</option>
            </select>

            <input type="hidden" name="page" value="1" />

            <button
              type="submit"
              className="h-11 rounded-full bg-gradient-to-r from-rose-500 to-rose-700 px-5 text-sm font-black text-white shadow-lg shadow-rose-950/30 transition hover:scale-[1.02]"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {["all", "approved", "pending", "draft", "rejected"].map((item) => (
              <Link
                key={item}
                href={statusUrl(item)}
                className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-wide transition ${
                  status === item
                    ? "border-rose-400 bg-rose-500 text-white"
                    : "border-white/10 bg-white/[0.06] text-white/55 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#f8f3ef] text-[#1b1210] shadow-2xl">
          <div className="flex flex-col gap-3 border-b border-black/10 bg-[#fffaf6] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black">Restaurant Listings</h2>
              <p className="mt-1 text-xs font-medium text-black/50">
                Premium card rows with quick view, performance, claim, and edit access.
              </p>
            </div>

            <div className="rounded-full bg-[#1b1210] px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white">
              Showing {count ? from + 1 : 0}-{Math.min(to + 1, count || 0)} of{" "}
              {formatNumber(count)}
            </div>
          </div>

          {!restaurants?.length ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-2xl">
                🌹
              </div>
              <p className="mt-4 text-lg font-black">No restaurants found</p>
              <p className="mt-1 text-sm text-black/50">
                Try changing your search or filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="group rounded-[1.5rem] border border-black/10 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-xl"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_420px_130px] lg:items-center">
                    <Link
                      href={`/locations/restaurants/${restaurant.id}?from=/admin/restaurants`}
                      className="flex min-w-0 items-center gap-4"
                    >
                      <div className="h-20 w-24 shrink-0 overflow-hidden rounded-[1.25rem] bg-[#eadfd8] shadow-sm">
                        {restaurant.image_url ? (
                          <img
                            src={restaurant.image_url}
                            alt={restaurant.restaurant_name || "Restaurant"}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-black text-black/30">
                            RO
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-black">
                            {restaurant.restaurant_name || "Untitled Restaurant"}
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusBadge(
                              restaurant.status
                            )}`}
                          >
                            {restaurant.status || "unknown"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-bold text-black/50">
                          {restaurant.city || "N/A"}, {restaurant.state || "N/A"}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#f5eee8] px-3 py-1 text-[11px] font-black uppercase text-black/55">
                            {restaurant.cuisine_type || "Cuisine N/A"}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase ${
                              restaurant.claimed
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-black/10 bg-[#f5eee8] text-black/50"
                            }`}
                          >
                            {restaurant.claimed ? "Claimed" : "Open Claim"}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="rounded-2xl bg-[#f5eee8] p-3 text-center">
                        <p className="text-[10px] font-black uppercase tracking-wide text-black/35">
                          Rating
                        </p>
                        <p className="mt-1 text-sm font-black">
                          🌹 {restaurant.rating || 0}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f5eee8] p-3 text-center">
                        <p className="text-[10px] font-black uppercase tracking-wide text-black/35">
                          Views
                        </p>
                        <p className="mt-1 text-sm font-black">
                          {formatNumber(restaurant.view_count)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f5eee8] p-3 text-center">
                        <p className="text-[10px] font-black uppercase tracking-wide text-black/35">
                          Clicks
                        </p>
                        <p className="mt-1 text-sm font-black">
                          {formatNumber(restaurant.click_count)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#1b1210] p-3 text-center text-white">
                        <p className="text-[10px] font-black uppercase tracking-wide text-white/40">
                          Score
                        </p>
                        <p className="mt-1 text-sm font-black">
                          {restaurant.roseout_score || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 lg:flex-col">
                      <Link
                        href={`/locations/restaurants/${restaurant.id}?from=/admin/restaurants`}
                        className="flex-1 rounded-full border border-black/10 bg-[#f5eee8] px-4 py-2 text-center text-xs font-black text-[#1b1210] transition hover:bg-[#1b1210] hover:text-white"
                      >
                        View
                      </Link>

                      <Link
                        href={`/locations/edit/restaurants/${restaurant.id}?from=/admin/restaurants`}
                        className="flex-1 rounded-full bg-gradient-to-r from-rose-500 to-rose-700 px-4 py-2 text-center text-xs font-black text-white shadow-sm transition hover:scale-[1.03]"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-5 flex items-center justify-between gap-4">
          <Link
            href={pageUrl(Math.max(1, page - 1))}
            className={`rounded-full px-5 py-3 text-sm font-black transition ${
              page <= 1
                ? "pointer-events-none border border-white/10 bg-white/[0.04] text-white/30"
                : "border border-white/10 bg-white text-black hover:scale-[1.02]"
            }`}
          >
            Previous
          </Link>

          <p className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white/55">
            Page {page} of {totalPages}
          </p>

          <Link
            href={pageUrl(Math.min(totalPages, page + 1))}
            className={`rounded-full px-5 py-3 text-sm font-black transition ${
              page >= totalPages
                ? "pointer-events-none border border-white/10 bg-white/[0.04] text-white/30"
                : "bg-gradient-to-r from-rose-500 to-rose-700 text-white hover:scale-[1.02]"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </main>
  );
}