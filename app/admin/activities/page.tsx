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

  if (value === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "pending") return "border-amber-200 bg-amber-50 text-amber-700";
  if (value === "rejected") return "border-red-200 bg-red-50 text-red-700";
  if (value === "draft") return "border-neutral-200 bg-neutral-100 text-neutral-700";

  return "border-neutral-200 bg-neutral-100 text-neutral-600";
}

export default async function AdminActivitiesPage({
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
    .from("activities")
    .select(
      "id, activity_name, activity_type, city, state, status, claimed, rating, view_count, click_count, roseout_score, image_url, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") query = query.eq("status", status);

  if (q) {
    query = query.or(
      `activity_name.ilike.%${q}%,city.ilike.%${q}%,activity_type.ilike.%${q}%`
    );
  }

  const { data: activities, error, count } = await query;

  const { count: totalActivities } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true });

  const { count: claimedActivities } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("claimed", true);

  const { count: unclaimedActivities } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true })
    .or("claimed.eq.false,claimed.is.null");

  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  const statusUrl = (newStatus: string) =>
    `/admin/activities?q=${encodeURIComponent(q)}&status=${newStatus}&page=1`;

  const pageUrl = (newPage: number) =>
    `/admin/activities?q=${encodeURIComponent(q)}&status=${status}&page=${newPage}`;

  return (
    <main className="min-h-screen bg-[#090706] px-4 pb-10 pt-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(225,29,72,0.22),transparent_35%),linear-gradient(135deg,#160b0b,#090706_55%,#140f0a)] p-5 shadow-2xl sm:p-6">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-rose-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-rose-300">
                RoseOut Admin
              </p>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Activities Admin
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                Manage activity inventory, claim status, performance, approval
                status, and quick listing edits.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Locations
              </p>
              <p className="mt-1 text-3xl font-black">{formatNumber(count)}</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-sm font-bold text-red-200">
            {error.message}
          </div>
        )}

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
              Total Locations
            </p>
            <p className="mt-2 text-3xl font-black">
              {formatNumber(totalActivities)}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
              Claimed
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-300">
              {formatNumber(claimedActivities)}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
              Unclaimed
            </p>
            <p className="mt-2 text-3xl font-black text-rose-200">
              {formatNumber(unclaimedActivities)}
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-[1.75rem] border border-white/10 bg-[#120d0b] p-4 shadow-2xl">
          <form className="grid gap-3 md:grid-cols-[1fr_200px_120px]">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search activity, city, or type..."
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
          <div className="flex flex-col gap-3 border-b border-black/10 bg-white/70 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black">Activity Listings</h2>
              <p className="mt-1 text-xs font-medium text-black/50">
                Click the activity name to view details or use Edit for quick updates.
              </p>
            </div>

            <div className="rounded-full bg-black px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white">
              Showing {count ? from + 1 : 0}-{Math.min(to + 1, count || 0)} of{" "}
              {formatNumber(count)}
            </div>
          </div>

          {!activities?.length ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-2xl">
                🌹
              </div>
              <p className="mt-4 text-lg font-black">No activities found</p>
              <p className="mt-1 text-sm text-black/50">
                Try changing your search or filter.
              </p>
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full table-fixed text-left text-xs">
                <thead className="bg-[#efe7df] text-[10px] uppercase tracking-[0.14em] text-black/45">
                  <tr>
                    <th className="w-[25%] px-3 py-3">Activity</th>
                    <th className="w-[10%] px-3 py-3">City</th>
                    <th className="w-[12%] px-3 py-3">Type</th>
                    <th className="w-[10%] px-3 py-3">Status</th>
                    <th className="w-[10%] px-3 py-3">Claim</th>
                    <th className="w-[7%] px-3 py-3">Rating</th>
                    <th className="w-[7%] px-3 py-3">Views</th>
                    <th className="w-[7%] px-3 py-3">Clicks</th>
                    <th className="w-[6%] px-3 py-3">Score</th>
                    <th className="w-[6%] px-3 py-3">Edit</th>
                  </tr>
                </thead>

                <tbody>
                  {activities.map((activity) => (
                    <tr
                      key={activity.id}
                      className="border-t border-black/10 transition hover:bg-rose-50/70"
                    >
                      <td className="px-3 py-3">
                        <Link
                          href={`/locations/activities/${activity.id}?from=/admin/activities`}
                          className="flex min-w-0 items-center gap-2"
                        >
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-neutral-200 shadow-sm">
                            {activity.image_url ? (
                              <img
                                src={activity.image_url}
                                alt={activity.activity_name || "Activity"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[#eadfd8] text-[10px] font-black text-black/30">
                                RO
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-black">
                              {activity.activity_name || "Untitled Activity"}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-black/40">
                              {activity.state || "N/A"}
                            </p>
                          </div>
                        </Link>
                      </td>

                      <td className="truncate px-3 py-3 font-bold">
                        {activity.city || "N/A"}
                      </td>

                      <td className="px-3 py-3">
                        <span className="block truncate rounded-full bg-black/[0.06] px-2 py-1 text-[10px] font-black uppercase text-black/60">
                          {activity.activity_type || "N/A"}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`block truncate rounded-full border px-2 py-1 text-center text-[10px] font-black uppercase ${statusBadge(
                            activity.status
                          )}`}
                        >
                          {activity.status || "unknown"}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`block truncate rounded-full border px-2 py-1 text-center text-[10px] font-black uppercase ${
                            activity.claimed
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-neutral-200 bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {activity.claimed ? "Claimed" : "Open"}
                        </span>
                      </td>

                      <td className="truncate px-3 py-3 font-black">
                        🌹 {activity.rating || 0}
                      </td>

                      <td className="truncate px-3 py-3 font-bold">
                        {formatNumber(activity.view_count)}
                      </td>

                      <td className="truncate px-3 py-3 font-bold">
                        {formatNumber(activity.click_count)}
                      </td>

                      <td className="px-3 py-3">
                        <span className="block rounded-full bg-[#1b1210] px-2 py-1 text-center text-[10px] font-black text-white">
                          {activity.roseout_score || 0}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <Link
                          href={`/locations/edit/activities/${activity.id}?from=/admin/activities`}
                          className="block rounded-full bg-gradient-to-r from-rose-500 to-rose-700 px-3 py-2 text-center text-[10px] font-black text-white shadow-sm transition hover:scale-[1.03]"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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