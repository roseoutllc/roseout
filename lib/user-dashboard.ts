import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type DashboardUserContext = Awaited<ReturnType<typeof getCurrentUserDashboardContext>>;

async function maybeSingle(table: string, select = "*", col = "id", value?: string | null) {
  if (!value) return null;
  try {
    const { data } = await supabaseAdmin.from(table).select(select).eq(col, value).maybeSingle();
    return data;
  } catch {
    return null;
  }
}

async function listLegacy(table: string, userId: string, limit = 20) {
  try {
    const { data } = await supabaseAdmin.from(table).select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

async function listCanonicalOutings(userId: string, limit = 50) {
  try {
    const { data } = await supabaseAdmin
      .from("outings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

function lifecycleStage(outing: any) {
  const status = String(outing?.status || "saved").toLowerCase();
  if (["completed", "completed_no_feedback"].includes(status)) return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "saved" && !outing?.reservation_clicked_at && !outing?.call_clicked_at && !outing?.external_booking_started_at && !outing?.external_booking_confirmed_at) return "saved";
  return "upcoming";
}

function selectedLocation(outing: any, type: "restaurant" | "activity") {
  const metadata = outing?.metadata && typeof outing.metadata === "object" ? outing.metadata : {};
  const selected = metadata?.selected_locations && typeof metadata.selected_locations === "object" ? metadata.selected_locations : {};
  return selected?.[type] && typeof selected[type] === "object" ? selected[type] : null;
}

export function normalizeCanonicalOuting(outing: any) {
  const restaurant = selectedLocation(outing, "restaurant");
  const activity = selectedLocation(outing, "activity");
  return {
    ...outing,
    lifecycle_stage: lifecycleStage(outing),
    title: outing?.plan_title || outing?.title || [restaurant?.restaurant_name || restaurant?.name, activity?.activity_name || activity?.name].filter(Boolean).join(" + ") || "TheOutHaven Outing",
    summary: outing?.source_query || outing?.summary || null,
    restaurant_name: restaurant?.restaurant_name || restaurant?.name || outing?.restaurant_name || null,
    restaurant_address: restaurant?.address || outing?.restaurant_address || null,
    restaurant_url: restaurant?.external_reservation_url || restaurant?.reservation_url || restaurant?.website || outing?.external_reservation_url || null,
    activity_name: activity?.activity_name || activity?.name || outing?.activity_name || null,
    activity_address: activity?.address || outing?.activity_address || null,
    activity_url: activity?.website || outing?.activity_url || null,
    booked_at: outing?.external_booking_confirmed_at || outing?.external_booking_started_at || outing?.reservation_clicked_at || outing?.call_clicked_at || null,
  };
}

export async function requireUserForDashboard(next = "/user/dashboard", loginPath = "/login") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`${loginPath}?next=${encodeURIComponent(next)}`);
  return user;
}

export async function getUserProfileForDashboard(userId: string) {
  const [profile, legacy] = await Promise.all([
    maybeSingle("user_profiles", "*", "id", userId),
    maybeSingle("users", "*", "id", userId),
  ]);
  return { profile, legacy, merged: { ...((legacy as any) || {}), ...((profile as any) || {}) } };
}

export async function getUserBetaStatus(userId: string, email?: string | null) {
  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const byUser = await supabaseAdmin.from("beta_testers").select("*").eq("user_id", userId).in("status", ["active", "approved"]).maybeSingle();
    if (byUser.data) return byUser.data;
    if (!normalizedEmail) return null;
    const byEmail = await supabaseAdmin.from("beta_testers").select("*").eq("email", normalizedEmail).in("status", ["active", "approved"]).maybeSingle();
    if (byEmail.data) {
      if (!byEmail.data.user_id) {
        await supabaseAdmin.from("beta_testers").update({ user_id: userId }).eq("id", byEmail.data.id);
        await supabaseAdmin.from("admin_audit_logs").insert({ action: "beta_user_linked", entity_type: "beta_tester", entity_id: byEmail.data.id, target_email: normalizedEmail, target_user_id: userId, summary: "Beta tester user_id auto-linked from dashboard email match", metadata: { source: "getUserBetaStatus" } });
        return { ...byEmail.data, user_id: userId };
      }
      return byEmail.data;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getUserOutingHistory(userId: string, limit = 24) {
  const canonical = (await listCanonicalOutings(userId, limit)).map(normalizeCanonicalOuting);
  const saved = canonical.filter((outing: any) => outing.lifecycle_stage === "saved");
  const upcoming = canonical.filter((outing: any) => outing.lifecycle_stage === "upcoming");
  const completed = canonical.filter((outing: any) => outing.lifecycle_stage === "completed");

  // Preserve pre-canonical history for existing users without letting legacy tables drive new writes.
  const [legacySaved, legacyBooked] = await Promise.all([
    saved.length < limit ? listLegacy("saved_plans", userId, Math.max(0, limit - saved.length)) : Promise.resolve([]),
    upcoming.length + completed.length < limit ? listLegacy("user_outings", userId, Math.max(0, limit - upcoming.length - completed.length)) : Promise.resolve([]),
  ]);
  const legacyUpcoming = legacyBooked.filter((outing: any) => !String(outing?.status || "").toLowerCase().includes("complete"));
  const legacyCompleted = legacyBooked.filter((outing: any) => String(outing?.status || "").toLowerCase().includes("complete"));

  return {
    saved: [...saved, ...legacySaved.map((row: any) => ({ ...row, lifecycle_stage: "saved", legacy_source: "saved_plans" }))].slice(0, limit),
    upcoming: [...upcoming, ...legacyUpcoming.map((row: any) => ({ ...row, lifecycle_stage: "upcoming", legacy_source: "user_outings" }))].slice(0, limit),
    completed: [...completed, ...legacyCompleted.map((row: any) => ({ ...row, lifecycle_stage: "completed", legacy_source: "user_outings" }))].slice(0, limit),
  };
}

export async function getUserSavedOutings(userId: string, limit = 12) {
  return (await getUserOutingHistory(userId, limit)).saved;
}
export async function getUserBookedOutings(userId: string, limit = 12) {
  return (await getUserOutingHistory(userId, limit)).upcoming;
}
export async function getUserCompletedOutings(userId: string, limit = 12) {
  return (await getUserOutingHistory(userId, limit)).completed;
}

export async function getUserInternalReservations(userId: string, limit = 5) {
  try {
    const { data } = await supabaseAdmin.from("location_reservations").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

export async function getUserSearchPlan(userId: string, beta: boolean) {
  if (beta) return { planKey: "beta", label: "Beta Tester", unlimited: true };
  const sub = await maybeSingle("customer_subscriptions", "*", "user_id", userId);
  const key = (sub as any)?.plan_key || "free";
  return { planKey: key, label: key === "unlimited" ? "TheOutHaven Plus" : "Free Account", unlimited: ["unlimited", "comped", "admin"].includes(key) };
}

export async function getUserWeeklyUsage(userId: string) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 7);
  try {
    const { count } = await supabaseAdmin.from("search_usage_events").select("id", { count: "exact", head: true }).eq("auth_user_id", userId).eq("allowed", true).gte("created_at", since.toISOString());
    return count || 0;
  } catch {
    return 0;
  }
}

async function buildDashboardContext(user: Awaited<ReturnType<typeof requireUserForDashboard>>) {
  const [profiles, history, reservations, beta] = await Promise.all([
    getUserProfileForDashboard(user.id),
    getUserOutingHistory(user.id, 12),
    getUserInternalReservations(user.id, 5),
    getUserBetaStatus(user.id, user.email),
  ]);
  const [plan, weeklyUsage] = await Promise.all([getUserSearchPlan(user.id, Boolean(beta)), getUserWeeklyUsage(user.id)]);
  return {
    user,
    profile: profiles.merged,
    userProfile: profiles.profile,
    usersRow: profiles.legacy,
    savedOutings: history.saved,
    bookedOutings: history.upcoming,
    completedOutings: history.completed,
    reservations,
    beta,
    isBeta: Boolean(beta),
    plan,
    weeklyUsage,
  };
}

export async function getCurrentUserDashboardContext() {
  return buildDashboardContext(await requireUserForDashboard());
}

export async function getCurrentBetaUserDashboardContext() {
  return buildDashboardContext(await requireUserForDashboard("/user/dashboard/beta", "/beta/login"));
}
