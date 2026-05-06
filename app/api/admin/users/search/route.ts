import { requireAdminApiRole } from "@/lib/admin-api-auth";
import { applySupabaseMultiWordSearch, sanitizeSearchTerm } from "@/lib/search";

export const dynamic = "force-dynamic";

type AdminUserSearchResult = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  subscription_status: string | null;
  created_at: string | null;
};

type SavedPlanSummary = {
  id: string;
  user_id: string;
  created_at: string | null;
};

export async function GET(req: Request) {
  const { error, supabase } = await requireAdminApiRole(["superuser", "admin"]);

  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const q = sanitizeSearchTerm(searchParams.get("q") || "");

    if (!q || q.length < 2) {
      return Response.json({ users: [] });
    }

    const usersQuery = supabase
      .from("users")
      .select("id,email,full_name,phone,role,subscription_status,created_at");

    const { data: users, error: fetchError } =
      await applySupabaseMultiWordSearch(
        usersQuery,
        ["email", "full_name", "phone"],
        q,
      )
        .order("created_at", { ascending: false })
        .limit(8);

    if (fetchError) {
      return Response.json(
        { error: fetchError.message, users: [] },
        { status: 500 },
      );
    }

    const userIds = (users || []).map((user) => user.id);

    let plans: SavedPlanSummary[] = [];

    if (userIds.length > 0) {
      const { data: planData } = await supabase
        .from("saved_plans")
        .select("id,user_id,created_at")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });

      plans = (planData || []) as SavedPlanSummary[];
    }

    const enhancedUsers = ((users || []) as AdminUserSearchResult[]).map(
      (user) => {
        const userPlans = plans.filter((plan) => plan.user_id === user.id);

        return {
          ...user,
          saved_plans_count: userPlans.length,
          last_activity: userPlans[0]?.created_at || user.created_at || null,
        };
      },
    );

    return Response.json({ users: enhancedUsers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";

    return Response.json({ error: message, users: [] }, { status: 500 });
  }
}
