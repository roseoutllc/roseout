import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { user_id, activity_id, location_id, is_admin, ...updates } = body;

  const targetActivityId = activity_id || location_id;

  if (!user_id || !targetActivityId) {
    return NextResponse.json(
      { error: "Missing user or activity." },
      { status: 400 }
    );
  }

  // Regular owners must be linked to this activity.
  // Admin/superuser can update any activity.
  if (!is_admin) {
    const { data: ownerRecord, error: ownerError } = await supabaseAdmin
      .from("activity_owners")
      .select("activity_id")
      .eq("user_id", user_id)
      .eq("activity_id", targetActivityId)
      .maybeSingle();

    if (ownerError || !ownerRecord) {
      return NextResponse.json(
        { error: "You do not have permission to update this activity." },
        { status: 403 }
      );
    }
  }

  const { data: activity, error } = await supabaseAdmin
    .from("activities")
    .update(updates)
    .eq("id", targetActivityId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activity });
}