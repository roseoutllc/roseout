import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

export async function POST() {
  const cookieStore = await cookies();

  const adminId = cookieStore.get("roseout_admin_user_id")?.value;
  const targetUserId = cookieStore.get("roseout_impersonate_user_id")?.value;

  if (adminId && targetUserId) {
    const supabase = adminSupabase();

    await supabase.from("admin_impersonation_logs").insert({
      admin_id: adminId,
      target_user_id: targetUserId,
      action: "stopped",
    });
  }

  cookieStore.delete("roseout_impersonate_user_id");

  return NextResponse.json({
    success: true,
  });
}