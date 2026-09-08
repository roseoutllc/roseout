type AuthUserLike = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

export type AdminLoginRole = "admin" | "superadmin" | "manager" | null;

function normalizeAdminLoginRole(role: unknown): AdminLoginRole {
  const normalized =
    typeof role === "string"
      ? role.trim().toLowerCase().replace(/\s+/g, "_")
      : role;
  const mapped =
    normalized === "superuser" || normalized === "super_admin"
      ? "superadmin"
      : normalized;

  if (mapped === "admin" || mapped === "superadmin" || mapped === "manager") {
    return mapped;
  }

  return null;
}

export async function getAdminLoginRole(
  supabase: any,
  user: AuthUserLike | null | undefined,
): Promise<AdminLoginRole> {
  if (!user?.id) return null;

  // Login routing must use the same protected identity source as Admin API/page
  // authorization. Never promote from user-editable metadata or email matching.
  const { data, error } = await supabase
    .from("admin_users")
    .select("role,user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getAdminLoginRole failed", {
      userId: user.id,
      message: error.message,
    });
    return null;
  }

  return normalizeAdminLoginRole(data?.role);
}
