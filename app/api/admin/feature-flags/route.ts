import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApiRole } from "@/lib/admin-api-auth";
import { ADMIN_PAGE_ACCESS } from "@/lib/admin-permissions";

const FEATURE_FLAG_FIELDS = "id,key,name,description,category,enabled,environment,rollout_percentage,created_at,updated_at";
const boundedText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function GET(req: Request) {
  const auth = await requireAdminApiRole(ADMIN_PAGE_ACCESS.featureFlags);
  if (auth.error) return auth.error;
  const sp = new URL(req.url).searchParams;
  let query = supabaseAdmin.from("feature_flags").select(FEATURE_FLAG_FIELDS).order("updated_at", { ascending: false });
  const search = boundedText(sp.get("search"), 120);
  const filter = sp.get("filter");
  if (filter === "enabled") query = query.eq("enabled", true);
  if (filter === "disabled") query = query.eq("enabled", false);
  if (filter === "production") query = query.eq("environment", "production");
  if (filter === "experimental") query = query.eq("category", "experimental");
  if (search) query = query.or(`key.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
  const { data, error } = await query.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ flags: data || [], envFlags: [{ key: "NEXT_PUBLIC_*", name: "Environment flags", enabled: true, readonly: true }] });
}

export async function POST(req: Request) {
  const auth = await requireAdminApiRole(ADMIN_PAGE_ACCESS.featureFlags);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  const key = boundedText(body.key, 120);
  const name = boundedText(body.name, 160);
  if (!key || !name) return NextResponse.json({ error: "key and name required" }, { status: 400 });
  const rollout = Math.max(0, Math.min(100, Number(body.rollout_percentage ?? 100)));
  const payload = {
    key,
    name,
    description: boundedText(body.description, 2000) || null,
    category: boundedText(body.category, 80) || null,
    enabled: Boolean(body.enabled),
    environment: boundedText(body.environment, 40) || "production",
    rollout_percentage: Number.isFinite(rollout) ? rollout : 100,
  };
  const { data, error } = await supabaseAdmin.from("feature_flags").insert(payload).select(FEATURE_FLAG_FIELDS).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ flag: data }, { status: 201 });
}
