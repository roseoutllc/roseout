import { NextResponse } from "next/server";
import { requireAdminApiRole } from "@/lib/admin-api-auth";
import { ADMIN_PAGE_ACCESS } from "@/lib/admin-permissions";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { DEFAULT_SEARCH_LIMITS } from "@/lib/search-usage-limits";

export async function GET() {
  const { error: authError } = await requireAdminApiRole(ADMIN_PAGE_ACCESS.settings);
  if (authError) return authError;
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", "search_usage_limits").maybeSingle();
  return NextResponse.json({ settings: { ...DEFAULT_SEARCH_LIMITS, ...(data?.value || {}) } });
}

export async function PATCH(req: Request) {
  const { adminUser, error: authError } = await requireAdminApiRole(ADMIN_PAGE_ACCESS.settings);
  if (authError || !adminUser) return authError || NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const value = { ...DEFAULT_SEARCH_LIMITS, ...body };
  const { error } = await supabaseAdmin.from("app_settings").upsert({ key: "search_usage_limits", value, updated_by: adminUser.user_id, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, settings: value });
}
