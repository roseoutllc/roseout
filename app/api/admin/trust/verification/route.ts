import { requireAdminApiRole } from "@/lib/admin-api-auth";
import { ADMIN_PAGE_ACCESS } from "@/lib/admin-permissions";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { reviewOrganizationVerification, reviewOrganizerVerification } from "@/lib/organizations/verification";

const ORGANIZATION_VERIFICATION_FIELDS = "id,organization_id,submitted_by_user_id,legal_name,website,contact_email,contact_phone,evidence,status,review_notes,reviewed_by_user_id,reviewed_at,created_at,updated_at" as const;
const ORGANIZER_VERIFICATION_FIELDS = "id,organization_id,organizer_profile_id,submitted_by_user_id,experience_summary,social_links,evidence,status,requested_trust_level,approved_trust_level,review_notes,reviewed_by_user_id,reviewed_at,created_at,updated_at" as const;

export async function GET(req: Request) {
  const auth = await requireAdminApiRole(ADMIN_PAGE_ACCESS.claims);
  if (auth.error) return auth.error;
  const type = new URL(req.url).searchParams.get("type") === "organizer" ? "organizer" : "organization";

  const result = type === "organizer"
    ? await supabaseAdmin
        .from("organizer_verification_requests")
        .select(ORGANIZER_VERIFICATION_FIELDS)
        .in("status", ["pending", "needs_more_info"])
        .order("created_at", { ascending: true })
        .limit(200)
    : await supabaseAdmin
        .from("organization_verification_requests")
        .select(ORGANIZATION_VERIFICATION_FIELDS)
        .in("status", ["pending", "needs_more_info"])
        .order("created_at", { ascending: true })
        .limit(200);

  if (result.error) return Response.json({ error: result.error.message }, { status: 500 });
  const requests = result.data || [];
  const organizationIds = Array.from(new Set(requests.map((row: any) => row.organization_id).filter(Boolean)));
  const { data: organizations } = organizationIds.length
    ? await supabaseAdmin.from("organizations").select("id,name,legal_name,organization_type,verification_status,trust_level").in("id", organizationIds)
    : { data: [] as any[] };
  const organizationMap = new Map((organizations || []).map((row: any) => [row.id, row]));
  return Response.json({ success: true, type, requests: requests.map((row: any) => ({ ...row, organization: organizationMap.get(row.organization_id) || null })) });
}

export async function POST(req: Request) {
  const auth = await requireAdminApiRole(ADMIN_PAGE_ACCESS.claimsManage);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const type = body?.type === "organizer" ? "organizer" : "organization";
    const decision = String(body?.decision || "");
    if (!["approved", "rejected", "needs_more_info"].includes(decision)) return Response.json({ error: "Invalid decision." }, { status: 400 });
    const actorUserId = auth.adminUser?.user_id;
    if (!actorUserId) return Response.json({ error: "Admin user is not linked." }, { status: 403 });
    const requestId = String(body?.requestId || "").trim();
    if (!requestId) return Response.json({ error: "Verification request is required." }, { status: 400 });
    const notes = typeof body?.notes === "string" ? body.notes.trim() || null : null;

    if (type === "organizer") {
      await reviewOrganizerVerification({ actorUserId, requestId, decision: decision as any, notes, approvedTrustLevel: Number(body.approvedTrustLevel || 1) });
    } else {
      await reviewOrganizationVerification({ actorUserId, requestId, decision: decision as any, notes });
    }
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error?.message || "Unable to review verification." }, { status: 400 });
  }
}
