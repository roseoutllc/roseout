import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export type AdminRole =
  | "superuser"
  | "admin"
  | "editor"
  | "reviewer"
  | "viewer";

/**
 * Get current logged-in admin user
 */
export async function getCurrentAdmin() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const { data: adminUser, error } = await supabase
    .from("admin_users")
    .select("id, email, full_name, role")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (error || !adminUser) {
    redirect("/login");
  }

  return adminUser;
}

/**
 * Protect pages by role
 */
export async function requireAdminRole(allowedRoles: AdminRole[]) {
  const adminUser = await getCurrentAdmin();

  if (!allowedRoles.includes(adminUser.role as AdminRole)) {
    redirect("/admin/unauthorized");
  }

  return adminUser;
}

/**
 * Optional helper (for UI logic)
 */
export function canAccess(
  userRole: AdminRole,
  allowedRoles: AdminRole[]
) {
  return allowedRoles.includes(userRole);
}