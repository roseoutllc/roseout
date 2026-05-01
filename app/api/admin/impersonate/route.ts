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

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const adminUserId = cookieStore.get("roseout_admin_user_id")?.value;

    if (!adminUserId) {
      return NextResponse.json(
        { error: "Admin session not found" },
        { status: 401 }
      );
    }

    const supabase = adminSupabase();

    const { data: admin } = await supabase
      .from("users")
      .select("id,email,role")
      .eq("id", adminUserId)
      .single();

    if (!admin || !["superuser", "admin"].includes(admin.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { data: targetUser } = await supabase
      .from("users")
      .select("id,email,full_name")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    if (targetUser.id === admin.id) {
      return NextResponse.json(
        { error: "You cannot impersonate yourself." },
        { status: 400 }
      );
    }

    cookieStore.set("roseout_impersonate_user_id", targetUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
    });

    await supabase.from("admin_impersonation_logs").insert({
      admin_id: admin.id,
      admin_email: admin.email,
      target_user_id: targetUser.id,
      target_user_email: targetUser.email,
      action: "started",
    });

    return NextResponse.json({
      success: true,
      message: "Impersonation started.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to impersonate user" },
      { status: 500 }
    );
  }
}