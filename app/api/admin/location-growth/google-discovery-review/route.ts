import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiRole } from "@/lib/admin-api-auth";
import { ADMIN_PAGE_ACCESS } from "@/lib/admin-permissions";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE = "google_curated_discovery";

type ReviewAction = "approve" | "keep_hidden";

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdminApiRole(ADMIN_PAGE_ACCESS.locationGrowth);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const action = body.action as ReviewAction;

  if (!id || !["approve", "keep_hidden"].includes(action)) {
    return NextResponse.json({ success: false, error: "A valid candidate and review action are required." }, { status: 400 });
  }

  const { data: candidate, error: candidateError } = await supabaseAdmin
    .from("location_import_staging")
    .select("id,source,duplicate_status,import_status,has_photos,photo_status,address,latitude,longitude,primary_category")
    .eq("id", id)
    .eq("source", SOURCE)
    .maybeSingle();

  if (candidateError || !candidate) {
    return NextResponse.json({ success: false, error: candidateError?.message || "Candidate not found." }, { status: 404 });
  }

  if (action === "approve") {
    if (candidate.duplicate_status === "duplicate") {
      return NextResponse.json({ success: false, error: "Confirmed duplicates cannot be approved for publish." }, { status: 409 });
    }
    if (!candidate.has_photos || candidate.photo_status === "missing_photo" || !candidate.address || candidate.latitude == null || candidate.longitude == null || !candidate.primary_category) {
      return NextResponse.json({ success: false, error: "This candidate is missing a required publishability field. Review the expanded details before approving." }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from("location_import_staging")
      .update({
        import_status: "staged",
        quality_status: "publish_ready",
        public_visibility_tier: "standard",
        is_low_level: false,
        low_level_reason: null,
        low_level_source: "manual_google_discovery_review",
        import_confidence: "high",
        source_quality_status: "manual_review_approved",
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("source", SOURCE)
      .select("id,import_status,quality_status,public_visibility_tier")
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, action, candidate: data });
  }

  const { data, error } = await supabaseAdmin
    .from("location_import_staging")
    .update({
      import_status: "hidden",
      quality_status: "review",
      public_visibility_tier: "hidden",
      is_low_level: false,
      low_level_reason: "manual_keep_hidden",
      low_level_source: "manual_google_discovery_review",
      rejection_reason: "manual_keep_hidden",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("source", SOURCE)
    .select("id,import_status,quality_status,public_visibility_tier")
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, action, candidate: data });
}
