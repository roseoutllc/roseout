"use client";

import { useMemo, useState } from "react";
import AdminLiveSessionsClient from "../live-sessions/AdminLiveSessionsClient";

type RestaurantMetric = {
  id: string;
  restaurant_name: string | null;
  city: string | null;
  view_count: number | null;
  click_count: number | null;
  roseout_score: number | null;
};

type ActivityMetric = {
  id: string;
  activity_name: string | null;
  city: string | null;
  view_count: number | null;
  click_count: number | null;
  roseout_score: number | null;
};

type AnalyticsEvent = {
  id: string;
  item_type: string | null;
  event_type: string | null;
  page_path: string | null;
  created_at: string | null;
};

type ReservationMetric = {
  id: string;
  status: string | null;
  arrived_at: string | null;
  completed_at: string | null;
};

type DashboardCategory =
  | "overview"
  | "live"
  | "performance"
  | "reservations"
  | "events";

type TableCategory = "all" | "restaurants" | "activities" | "events";

type Props = {
  restaurants: RestaurantMetric[];
  activities: ActivityMetric[];
  recentEvents: AnalyticsEvent[];
  reservations: ReservationMetric[];
};

const dashboardCategories: { label: string; value: DashboardCategory }[] = [
  { label: "Overview", value: "overview" },
  { label: "Live Command Center", value: "live" },
  { label: "Discovery Performance", value: "performance" },
  { label: "Reservations", value: "reservations" },
  { label: "Recent Events", value: "events" },
];

const tableCategories: { label: string; value: TableCategory }[] = [
  { label: "All", value: "all" },
  { label: "Restaurants", value: "restaurants" },
  { label: "Activities", value: "activities" },
  { label: "Events", value: "events" },
];

function sumMetric<T>(items: T[], getter: (item: T) => number | null) {
  return items.reduce((sum, item) => sum + Number(getter(item) || 0), 0);
}

export default function AnalyticsDashboardClient({
  restaurants,
  activities,
  recentEvents,
  reservations,
}: Props) {
  const [dashboardCategory, setDashboardCategory] =
    useState<DashboardCategory>("overview");
  const [tableCategory, setTableCategory] =
    useState<TableCategory>("all");

  const metrics = useMemo(() => {
    const totalRestaurantViews = sumMetric(
      restaurants,
      (restaurant) => restaurant.view_count
    );
    const totalRestaurantClicks = sumMetric(
      restaurants,
      (restaurant) => restaurant.click_count
    );
    const totalActivityViews = sumMetric(
      activities,
      (activity) => activity.view_count
    );
    const totalActivityClicks = sumMetric(
      activities,
      (activity) => activity.click_count
    );
    const totalViews = totalRestaurantViews + totalActivityViews;
    const totalClicks = totalRestaurantClicks + totalActivityClicks;

    const reservationStats = {
      total: reservations.length,
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      arrived: reservations.filter((r) => r.status === "arrived").length,
      completed: reservations.filter((r) => r.status === "completed").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
      noShow: reservations.filter((r) => r.status === "no_show").length,
    };

    const arrivalRate = reservationStats.total
      ? Math.round(
          ((reservationStats.arrived + reservationStats.completed) /
            reservationStats.total) *
            100
        )
      : 0;

    const noShowRate = reservationStats.total
      ? Math.round((reservationStats.noShow / reservationStats.total) * 100)
      : 0;

    return {
      totalRestaurantViews,
      totalRestaurantClicks,
      totalActivityViews,
      totalActivityClicks,
      totalViews,
      totalClicks,
      clickRate: totalViews ? Math.round((totalClicks / totalViews) * 100) : 0,
      reservationStats,
      arrivalRate,
      noShowRate,
    };
  }, [activities, reservations, restaurants]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/30 sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-600/20 blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-red-900/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-rose-300">
              RoseOut Admin
            </p>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">
              Analytics Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
              A simpler command view for discovery, reservations, live user
              behavior, and recent events.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[520px]">
            <Dropdown
              label="Dashboard Category"
              value={dashboardCategory}
              onChange={(value) => setDashboardCategory(value as DashboardCategory)}
              options={dashboardCategories}
            />
            <Dropdown
              label="Table Category"
              value={tableCategory}
              onChange={(value) => setTableCategory(value as TableCategory)}
              options={tableCategories}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Views" value={metrics.totalViews} tone="rose" />
        <MetricCard label="Total Clicks" value={metrics.totalClicks} />
        <MetricCard label="Click Rate" value={`${metrics.clickRate}%`} />
        <MetricCard
          label="Reservations"
          value={metrics.reservationStats.total}
          tone="gold"
        />
      </section>

      {dashboardCategory === "overview" && (
        <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <Panel eyebrow="Snapshot" title="What matters right now">
            <div className="grid gap-4 sm:grid-cols-2">
              <MiniStat label="Restaurant Views" value={metrics.totalRestaurantViews} />
              <MiniStat label="Restaurant Clicks" value={metrics.totalRestaurantClicks} />
              <MiniStat label="Activity Views" value={metrics.totalActivityViews} />
              <MiniStat label="Activity Clicks" value={metrics.totalActivityClicks} />
            </div>
          </Panel>

          <Panel eyebrow="Reserve" title="Booking health">
            <div className="grid gap-4 sm:grid-cols-2">
              <MiniStat label="Arrival Rate" value={`${metrics.arrivalRate}%`} />
              <MiniStat label="No-Show Rate" value={`${metrics.noShowRate}%`} />
              <MiniStat label="Confirmed" value={metrics.reservationStats.confirmed} />
              <MiniStat label="Completed" value={metrics.reservationStats.completed} />
            </div>
          </Panel>
        </section>
      )}

      {dashboardCategory === "live" && <AdminLiveSessionsClient embedded />}

      {dashboardCategory === "performance" && (
        <Panel eyebrow="Discovery" title="Views and click performance">
          <div className="grid gap-4 md:grid-cols-4">
            <MiniStat label="Restaurant Views" value={metrics.totalRestaurantViews} />
            <MiniStat label="Restaurant Clicks" value={metrics.totalRestaurantClicks} />
            <MiniStat label="Activity Views" value={metrics.totalActivityViews} />
            <MiniStat label="Activity Clicks" value={metrics.totalActivityClicks} />
          </div>
        </Panel>
      )}

      {dashboardCategory === "reservations" && (
        <Panel eyebrow="Reserve" title="Reservation pipeline">
          <div className="space-y-4">
            <PipelineRow
              label="Confirmed"
              value={metrics.reservationStats.confirmed}
              total={metrics.reservationStats.total}
            />
            <PipelineRow
              label="Arrived"
              value={metrics.reservationStats.arrived}
              total={metrics.reservationStats.total}
            />
            <PipelineRow
              label="Completed"
              value={metrics.reservationStats.completed}
              total={metrics.reservationStats.total}
            />
            <PipelineRow
              label="Cancelled"
              value={metrics.reservationStats.cancelled}
              total={metrics.reservationStats.total}
            />
            <PipelineRow
              label="No-show"
              value={metrics.reservationStats.noShow}
              total={metrics.reservationStats.total}
            />
          </div>
        </Panel>
      )}

      {dashboardCategory === "events" && (
        <Panel eyebrow="Stream" title="Recent activity events">
          <EventList events={recentEvents} />
        </Panel>
      )}

      <Panel eyebrow="Category Table" title="Detailed view">
        {tableCategory === "all" && (
          <AllCategoryTable
            restaurants={restaurants}
            activities={activities}
            events={recentEvents}
          />
        )}
        {tableCategory === "restaurants" && <RestaurantTable rows={restaurants} />}
        {tableCategory === "activities" && <ActivityTable rows={activities} />}
        {tableCategory === "events" && <EventList events={recentEvents} />}
      </Panel>
    </div>
  );
}

function Dropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-rose-300"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-black">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "rose" | "gold";
}) {
  const toneClass =
    tone === "rose"
      ? "border-rose-400/25 bg-rose-500/15"
      : tone === "gold"
        ? "border-yellow-400/25 bg-yellow-500/10"
        : "border-white/10 bg-white/[0.045]";

  return (
    <div className={`rounded-[1.5rem] border p-5 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-300">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function PipelineRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-white/70">{label}</p>
        <p className="text-sm font-black text-white">
          {value} · {percent}%
        </p>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-rose-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function AllCategoryTable({
  restaurants,
  activities,
  events,
}: {
  restaurants: RestaurantMetric[];
  activities: ActivityMetric[];
  events: AnalyticsEvent[];
}) {
  const rows = [
    ...restaurants.map((row) => [
      "Restaurant",
      row.restaurant_name || "Unnamed restaurant",
      row.city || "N/A",
      row.view_count || 0,
      row.click_count || 0,
      row.roseout_score || 0,
    ]),
    ...activities.map((row) => [
      "Activity",
      row.activity_name || "Unnamed activity",
      row.city || "N/A",
      row.view_count || 0,
      row.click_count || 0,
      row.roseout_score || 0,
    ]),
    ...events.map((event) => [
      "Event",
      event.event_type || "event",
      event.page_path || "Unknown page",
      event.item_type || "general",
      event.created_at ? new Date(event.created_at).toLocaleString() : "N/A",
      "—",
    ]),
  ];

  return (
    <ResponsiveTable
      headers={[
        "Category",
        "Name / Event",
        "Location / Page",
        "Views / Type",
        "Clicks / Time",
        "Score",
      ]}
      rows={rows}
    />
  );
}

function RestaurantTable({ rows }: { rows: RestaurantMetric[] }) {
  return (
    <ResponsiveTable
      headers={["Restaurant", "City", "Views", "Clicks", "Score"]}
      rows={rows.map((row) => [
        row.restaurant_name || "Unnamed restaurant",
        row.city || "N/A",
        row.view_count || 0,
        row.click_count || 0,
        row.roseout_score || 0,
      ])}
    />
  );
}

function ActivityTable({ rows }: { rows: ActivityMetric[] }) {
  return (
    <ResponsiveTable
      headers={["Activity", "City", "Views", "Clicks", "Score"]}
      rows={rows.map((row) => [
        row.activity_name || "Unnamed activity",
        row.city || "N/A",
        row.view_count || 0,
        row.click_count || 0,
        row.roseout_score || 0,
      ])}
    />
  );
}

function ResponsiveTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.16em] text-white/40">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-5 py-4 font-black">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-white/45" colSpan={headers.length}>
                  No data available.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="border-t border-white/10">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${index}-${cellIndex}`}
                      className={`px-5 py-4 ${
                        cellIndex === 0 ? "font-black text-white" : "text-white/65"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventList({ events }: { events: AnalyticsEvent[] }) {
  return (
    <div className="space-y-3">
      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-black/25 p-8 text-sm text-white/45">
          No recent events.
        </div>
      ) : (
        events.map((event) => (
          <div
            key={event.id}
            className="rounded-2xl border border-white/10 bg-black/25 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black capitalize text-white">
                  {event.event_type || "event"}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {event.page_path || "Unknown page"}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold capitalize text-white/55">
                  {event.item_type || "general"}
                </span>
                <p className="mt-2 text-xs text-white/35">
                  {event.created_at
                    ? new Date(event.created_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
