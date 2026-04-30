import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { id, type, event } = await req.json();

  if (!id || !type || !event) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const table = type === "restaurant" ? "restaurants" : "activities";

  const field =
    event === "view"
      ? "view_count"
      : event === "click"
      ? "click_count"
      : event === "claim"
      ? "claim_count"
      : null;

  if (!field) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  const { data: item, error: itemError } = await supabaseAdmin
    .from(table)
    .select(field)
    .eq("id", id)
    .single();

  if (itemError || !item) {
    return NextResponse.json(
      { error: "Location not found." },
      { status: 404 }
    );
  }

  const currentValue = Number(item[field] || 0);

  const { error } = await supabaseAdmin
    .from(table)
    .update({ [field]: currentValue + 1 })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}