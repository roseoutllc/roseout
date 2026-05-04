import { requireAdminRole } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export default async function AdminAnalyticsPage() {
  await requireAdminRole(["superuser", "admin", "viewer"]);

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, restaurant_name, city, view_count, click_count, roseout_score")
    .order("view_count", { ascending: false })
    .limit(10);

  const { data: activities } = await supabase
    .from("activities")
    .select("id, activity_name, city, view_count, click_count, roseout_score")
    .order("view_count", { ascending: false })
    .limit(10);

  const { data: recentEvents } = await supabase
    .from("analytics_events")
    .select("id, item_type, event_type, page_path, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: reservations } = await supabase
    .from("location_reservations")
    .select("id, status, arrived_at, completed_at");

  const totalRestaurantViews =
    restaurants?.reduce((sum, r) => sum + Number(r.view_count || 0), 0) || 0;

  const totalRestaurantClicks =
    restaurants?.reduce((sum, r) => sum + Number(r.click_count || 0), 0) || 0;

  const totalActivityViews =
    activities?.reduce((sum, a) => sum + Number(a.view_count || 0), 0) || 0;

  const totalActivityClicks =
    activities?.reduce((sum, a) => sum + Number(a.click_count || 0), 0) || 0;

  const reservationStats = {
    total: reservations?.length || 0,
    confirmed:
      reservations?.filter((r) => r.status === "confirmed").length || 0,
    arrived: reservations?.filter((r) => r.status === "arrived").length || 0,
    completed:
      reservations?.filter((r) => r.status === "completed").length || 0,
    cancelled:
      reservations?.filter((r) => r.status === "cancelled").length || 0,
    noShow: reservations?.filter((r) => r.status === "no_show").length || 0,
  };

  const arrivalRate =
    reservationStats.total > 0
      ? Math.round(
          ((reservationStats.arrived + reservationStats.completed) /
            reservationStats.total) *
            100
        )
      : 0;

  const noShowRate =
    reservationStats.total > 0
      ? Math.round((reservationStats.noShow / reservationStats.total) * 100)
      : 0;

  return (
    <div>
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-500">
        RoseOut Admin
      </p>

      <h1 className="text-4xl font-extrabold tracking-tight">
        Analytics Dashboard
      </h1>

      <p className="mt-3 text-neutral-400">
        View restaurant and activity views, clicks, reservation performance, and
        recent analytics events.
      </p>

      <section className="mt-8 grid gap-5 md:grid-cols-4">
        <MetricCard label="Restaurant Views" value={totalRestaurantViews} />
        <MetricCard label="Restaurant Clicks" value={totalRestaurantClicks} />
        <MetricCard label="Activity Views" value={totalActivityViews} />
        <MetricCard label="Activity Clicks" value={totalActivityClicks} />
      </section>

      <section className="mt-5 grid gap-5 md:grid-cols-4">
        <MetricCard label="Reservations" value={reservationStats.total} />
        <MetricCard label="Confirmed" value={reservationStats.confirmed} />
        <MetricCard label="Arrived" value={reservationStats.arrived} />
        <MetricCard label="Completed" value={reservationStats.completed} />
      </section>

      <section className="mt-5 grid gap-5 md:grid-cols-4">
        <MetricCard label="Cancelled" value={reservationStats.cancelled} />
        <MetricCard label="No Shows" value={reservationStats.noShow} />
        <MetricCard label="Arrival Rate" value={`${arrivalRate}%`} />
        <MetricCard label="No-Show Rate" value={`${noShowRate}%`} />
      </section>

      <section className="mt-8 overflow-hidden rounded-[2rem] bg-white text-black">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="text-xl font-bold">Top Restaurants</h2>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-100 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-5 py-4">Restaurant</th>
              <th className="px-5 py-4">City</th>
              <th className="px-5 py-4">Views</th>
              <th className="px-5 py-4">Clicks</th>
              <th className="px-5 py-4">Score</th>
            </tr>
          </thead>

          <tbody>
            {restaurants?.map((r) => (
              <tr key={r.id} className="border-t border-neutral-200">
                <td className="px-5 py-4 font-bold">{r.restaurant_name}</td>
                <td className="px-5 py-4">{r.city || "N/A"}</td>
                <td className="px-5 py-4">{r.view_count || 0}</td>
                <td className="px-5 py-4">{r.click_count || 0}</td>
                <td className="px-5 py-4">{r.roseout_score || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8 overflow-hidden rounded-[2rem] bg-white text-black">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="text-xl font-bold">Top Activities</h2>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-100 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-5 py-4">Activity</th>
              <th className="px-5 py-4">City</th>
              <th className="px-5 py-4">Views</th>
              <th className="px-5 py-4">Clicks</th>
              <th className="px-5 py-4">Score</th>
            </tr>
          </thead>

          <tbody>
            {activities?.map((a) => (
              <tr key={a.id} className="border-t border-neutral-200">
                <td className="px-5 py-4 font-bold">{a.activity_name}</td>
                <td className="px-5 py-4">{a.city || "N/A"}</td>
                <td className="px-5 py-4">{a.view_count || 0}</td>
                <td className="px-5 py-4">{a.click_count || 0}</td>
                <td className="px-5 py-4">{a.roseout_score || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8 overflow-hidden rounded-[2rem] bg-white text-black">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="text-xl font-bold">Recent Events</h2>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-100 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-5 py-4">Type</th>
              <th className="px-5 py-4">Event</th>
              <th className="px-5 py-4">Page</th>
              <th className="px-5 py-4">Time</th>
            </tr>
          </thead>

          <tbody>
            {recentEvents?.map((event) => (
              <tr key={event.id} className="border-t border-neutral-200">
                <td className="px-5 py-4 capitalize">{event.item_type}</td>
                <td className="px-5 py-4 capitalize">{event.event_type}</td>
                <td className="px-5 py-4">{event.page_path || "N/A"}</td>
                <td className="px-5 py-4">
                  {event.created_at
                    ? new Date(event.created_at).toLocaleString()
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 text-black">
      <p className="text-sm font-bold text-neutral-500">{label}</p>
      <p className="mt-2 text-4xl font-extrabold">{value}</p>
    </div>
  );
}