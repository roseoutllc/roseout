import { NextResponse } from "next/server";
import { requireAdminApiRole } from "@/lib/admin-api-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ADMIN_PAGE_ACCESS } from "@/lib/admin-permissions";

const ADMIN_LOG_FIELDS = "id,category,level,message,source,actor_id,actor_email,entity_type,entity_id,request_id,created_at";
const bounded = (value: string | null, max = 120) => (value || "").trim().slice(0, max);

export async function GET(req: Request) {
  const auth = await requireAdminApiRole(ADMIN_PAGE_ACCESS.logs);
  if (auth.error) return auth.error;

  const sp = new URL(req.url).searchParams;
  let query = supabaseAdmin.from("admin_system_logs").select(ADMIN_LOG_FIELDS).order("created_at", { ascending: false });
  const category = bounded(sp.get("category"), 80);
  const level = bounded(sp.get("level"), 40);
  const entityType = bounded(sp.get("entity_type"), 80);
  const actor = bounded(sp.get("actor"));
  const search = bounded(sp.get("search"));
  if (category && category !== "all") query = query.eq("category", category);
  if (level && level !== "all") query = query.eq("level", level);
  if (entityType) query = query.eq("entity_type", entityType);
  if (actor) query = query.ilike("actor_email", `%${actor}%`);
  if (search) query = query.or(`message.ilike.%${search}%,source.ilike.%${search}%`);
  const parsedLimit = Number(sp.get("limit") || 100);
  const limit = Number.isFinite(parsedLimit) ? Math.min(250, Math.max(1, Math.trunc(parsedLimit))) : 100;
  const { data, error } = await query.limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data || [] });
}
