import { requireAdminApiRole } from "@/lib/admin-api-auth";

export const dynamic = "force-dynamic";

//
// GET → search app users (for impersonation)
//
export async function GET(req: Request) {
  const { error, supabase } = await requireAdminApiRole([
    "superuser",
    "admin",
  ]);

  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return Response.json({ users: [] });
    }

    const { data, error: fetchError } = await supabase
      .from("users")
      .select("id,email,full_name,phone,role,subscription_status")
      .or(`email.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(8);

    if (fetchError) {
      return Response.json(
        { error: fetchError.message, users: [] },
        { status: 500 }
      );
    }

    return Response.json({ users: data || [] });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Server error", users: [] },
      { status: 500 }
    );
  }
}