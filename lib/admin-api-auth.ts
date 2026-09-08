import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { AdminRole } from "@/lib/users/roles";
import { isAdminRole, normalizeRole } from "@/lib/users/roles";
import { adminIdentitySatisfiesPolicy } from "@/lib/admin-identity-policy";
import { permissionKeyForAdminRoleList } from "@/lib/admin-permissions";
import { adminRoleHasPermission } from "@/lib/admin-role-policy";

function normalizeAdminRole(role: unknown): AdminRole | null {
  if (typeof role !== "string") return null;
  const normalized = normalizeRole(role);
  return isAdminRole(normalized) ? normalized : null;
}

function normalizeAllowedRoles(allowedRoles: readonly AdminRole[]) {
  return allowedRoles
    .map((role) => normalizeAdminRole(role))
    .filter((role): role is AdminRole => Boolean(role));
}

function authJson(error: "Unauthorized" | "Forbidden", status: 401 | 403, code?: string) {
  return Response.json({ success: false, error, ...(code ? { code } : {}) }, { status });
}

async function providerPolicyFailure(supabase: Awaited<ReturnType<typeof createClient>>) {
  await supabase.auth.signOut().catch(() => undefined);
  return {
    error: authJson("Forbidden", 403, "provider_required"),
    adminUser: null,
    supabase,
  };
}

function buildAdminUser({
  userId,
  email,
  fullName,
  role,
}: {
  userId: string;
  email?: string | null;
  fullName?: unknown;
  role: AdminRole;
}) {
  return {
    user_id: userId,
    email: email ?? null,
    full_name: typeof fullName === "string" ? fullName : null,
    role,
  };
}

export async function requireAdminApiRole(allowedRoles: readonly AdminRole[]) {
  const supabase = await createClient();
  const allowed = normalizeAllowedRoles(allowedRoles);
  const permission = permissionKeyForAdminRoleList(allowedRoles);
  const roleAllowed = async (role: AdminRole) =>
    permission ? adminRoleHasPermission(role, permission) : allowed.includes(role);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return {
      error: authJson("Unauthorized", 401),
      adminUser: null,
      supabase,
    };
  }

  // Admin API authorization is intentionally anchored to the protected admin_users
  // row for the exact authenticated user id. Do not fall back to user-editable
  // metadata, general profile role columns, or email-only rebinding.
  const { data: adminUser, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("user_id, email, full_name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const adminUserRole = normalizeAdminRole(adminUser?.role);

  if (adminError || !adminUser || !adminUserRole || !(await roleAllowed(adminUserRole))) {
    return {
      error: authJson("Forbidden", 403),
      adminUser: null,
      supabase,
    };
  }

  if (!adminIdentitySatisfiesPolicy(adminUserRole, user)) {
    return providerPolicyFailure(supabase);
  }

  return {
    error: null,
    adminUser: buildAdminUser({
      userId: adminUser.user_id,
      email: adminUser.email || user.email,
      fullName: adminUser.full_name,
      role: adminUserRole,
    }),
    supabase,
  };
}

export async function requireSuperAdmin() {
  return requireAdminApiRole(["superadmin"]);
}

export function safeAdminError(action = "admin_action", status = 500) {
  return Response.json(
    { success: false, action, error: "Request could not be completed." },
    { status },
  );
}
