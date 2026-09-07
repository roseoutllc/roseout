import "server-only";

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { adminIdentitySatisfiesPolicy } from "@/lib/admin-identity-policy";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminRole, normalizeRole, type AdminRole } from "@/lib/users/roles";

function normalizeAdminRole(value: unknown): AdminRole | null {
  if (typeof value !== "string") return null;
  const role = normalizeRole(value);
  return isAdminRole(role) ? role : null;
}

export async function authorizeAdminApiBoundary(request: NextRequest) {
  let response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          response = NextResponse.next();
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  let { data: adminUser } = await supabaseAdmin
    .from("admin_users")
    .select("user_id,email,role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminUser && user.email) {
    const { data: byEmail } = await supabaseAdmin
      .from("admin_users")
      .select("user_id,email,role")
      .ilike("email", user.email)
      .limit(1)
      .maybeSingle();
    adminUser = byEmail;
    if (byEmail?.role && !byEmail.user_id) {
      await supabaseAdmin.from("admin_users").update({ user_id: user.id }).eq("email", byEmail.email).is("user_id", null);
    }
  }

  const role = normalizeAdminRole(adminUser?.role);
  if (!role || !adminIdentitySatisfiesPolicy(role, user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  return response;
}
