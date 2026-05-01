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
      .select("id,role,email")
      .eq("id", adminUserId)
      .single();

    if (!admin || admin.role !== "superuser") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { data: targetUser } = await supabase
      .from("users")
      .select("id,email")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    cookieStore.set("roseout_impersonate_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
    });

    await supabase.from("admin_impersonation_logs").insert({
      admin_id: admin.id,
      target_user_id: userId,
      action: "started",
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to impersonate user" },
      { status: 500 }
    );
  }
}