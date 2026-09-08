import { NextRequest } from "next/server";
import { requireAdminApiRole } from "@/lib/admin-api-auth";
import { ADMIN_PAGE_ACCESS } from "@/lib/admin-permissions";
import { getKbCategories, slugifyKb } from "@/lib/knowledge-base/server";
import { roleCanManageKb } from "@/lib/knowledge-base/access";
import { supabaseAdmin } from "@/lib/supabase-admin";

const CATEGORY_FIELDS = "id,name,slug,description,icon,audience,sort_order,is_active,created_at,updated_at";

export async function GET() {
  const { error } = await requireAdminApiRole(ADMIN_PAGE_ACCESS.knowledgeBase);
  if (error) return error;
  const categories = await getKbCategories(false);
  return Response.json({ success: true, categories });
}

export async function POST(request: NextRequest) {
  const { error, adminUser } = await requireAdminApiRole(ADMIN_PAGE_ACCESS.knowledgeBase);
  if (error) return error;
  if (!roleCanManageKb(adminUser.role)) return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const name = String(body.name || "").trim().slice(0, 120);
  if (!name) return Response.json({ success: false, error: "Name is required" }, { status: 400 });
  const payload = {
    name,
    slug: slugifyKb(body.slug || name),
    description: body.description ? String(body.description).slice(0, 1000) : null,
    icon: body.icon ? String(body.icon).slice(0, 120) : null,
    audience: body.audience || "internal",
    sort_order: Number(body.sort_order || 0),
    is_active: body.is_active !== false,
    updated_by: adminUser.user_id,
    created_by: body.id ? undefined : adminUser.user_id,
  };
  const result = body.id
    ? await supabaseAdmin.from("knowledge_base_categories").update(payload).eq("id", body.id).select(CATEGORY_FIELDS).single()
    : await supabaseAdmin.from("knowledge_base_categories").insert(payload).select(CATEGORY_FIELDS).single();
  if (result.error) return Response.json({ success: false, error: result.error.message }, { status: 400 });
  return Response.json({ success: true, category: result.data });
}
