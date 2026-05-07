import { requireAdminRole } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import AnalyticsDashboardClient from "./AnalyticsDashboardClient";

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

  return (
    <AnalyticsDashboardClient
      restaurants={restaurants || []}
      activities={activities || []}
      recentEvents={recentEvents || []}
      reservations={reservations || []}
    />
  );
}
