import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { user_id, restaurant_id, is_admin, ...updates } = body;

  if (!user_id || !restaurant_id) {
    return NextResponse.json(
      { error: "Missing user or restaurant." },
      { status: 400 }
    );
  }

  if (!is_admin) {
    const { data: ownerRecord, error: ownerError } = await supabaseAdmin
      .from("restaurant_owners")
      .select("restaurant_id")
      .eq("user_id", user_id)
      .eq("restaurant_id", restaurant_id)
      .maybeSingle();

    if (ownerError || !ownerRecord) {
      return NextResponse.json(
        { error: "You do not have permission to update this restaurant." },
        { status: 403 }
      );
    }
  }

  const { data: restaurant, error } = await supabaseAdmin
    .from("restaurants")
    .update(updates)
    .eq("id", restaurant_id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ restaurant });
}