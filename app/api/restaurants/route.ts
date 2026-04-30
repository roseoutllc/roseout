import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select(
      `
      *,
      restaurant_owners (
        id,
        user_id,
        name,
        email
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ restaurant: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const {
    owner_name,
    owner_email,
    restaurant_owners,
    ...updates
  } = body;

  const { error } = await supabaseAdmin
    .from("restaurants")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (owner_name !== undefined || owner_email !== undefined) {
    const { data: existingOwner } = await supabaseAdmin
      .from("restaurant_owners")
      .select("id")
      .eq("restaurant_id", id)
      .maybeSingle();

    if (existingOwner) {
      await supabaseAdmin
        .from("restaurant_owners")
        .update({
          name: owner_name,
          email: owner_email,
        })
        .eq("restaurant_id", id);
    } else if (owner_name || owner_email) {
      await supabaseAdmin.from("restaurant_owners").insert({
        restaurant_id: id,
        name: owner_name,
        email: owner_email,
      });
    }
  }

  const { data: restaurant, error: fetchError } = await supabaseAdmin
    .from("restaurants")
    .select(
      `
      *,
      restaurant_owners (
        id,
        user_id,
        name,
        email
      )
    `
    )
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ restaurant });
}