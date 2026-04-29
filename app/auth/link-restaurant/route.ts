import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.userId || !body.email) {
    return NextResponse.json({ error: "Missing user info" }, { status: 400 });
  }

  await supabaseAdmin
    .from("restaurants")
    .update({
      owner_user_id: body.userId,
      owner_email: body.email,
    })
    .ilike("email", body.email);

  await supabaseAdmin.auth.admin.updateUserById(body.userId, {
    user_metadata: {
      role: "restaurants",
    },
  });

  return NextResponse.json({ success: true });
}