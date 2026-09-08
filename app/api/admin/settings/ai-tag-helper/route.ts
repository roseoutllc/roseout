import { NextResponse } from "next/server";
import { requireAdminApiRole } from "@/lib/admin-api-auth";
import { ADMIN_PAGE_ACCESS } from "@/lib/admin-permissions";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { AI_TAG_HELPER_ACCESS_VALUES, AI_TAG_HELPER_SETTINGS_KEY, DEFAULT_AI_TAG_HELPER_SETTINGS, normalizeAiTagHelperSettings } from "@/lib/ai-tag-helper-settings";

export async function GET() {
  const { error: authError } = await requireAdminApiRole(ADMIN_PAGE_ACCESS.settings);
  if (authError) return authError;
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", AI_TAG_HELPER_SETTINGS_KEY).maybeSingle();
  return NextResponse.json({ settings: normalizeAiTagHelperSettings(data?.value) });
}

export async function PATCH(req: Request) {
  const { adminUser, error: authError } = await requireAdminApiRole(ADMIN_PAGE_ACCESS.settings);
  if (authError || !adminUser) return authError || NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!AI_TAG_HELPER_ACCESS_VALUES.includes(body?.access)) return NextResponse.json({ error: "Invalid AI Tag Helper access value." }, { status: 400 });
  const value = { ...DEFAULT_AI_TAG_HELPER_SETTINGS, access: body.access };
  const { error } = await supabaseAdmin.from("app_settings").upsert({ key: AI_TAG_HELPER_SETTINGS_KEY, value, updated_by: adminUser.user_id, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, settings: value });
}
