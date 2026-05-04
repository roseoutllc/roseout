import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isExpired(expiresAt?: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = cleanString(searchParams.get("token"));

    if (!token) {
      return NextResponse.json({ error: "Missing token." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("location_reservations")
      .select("*")
      .eq("customer_token", token)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    if (isExpired(data.customer_token_expires_at)) {
      return NextResponse.json(
        { error: "This reservation link has expired." },
        { status: 410 }
      );
    }

    return NextResponse.json({ reservation: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Something went wrong." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const token = cleanString(body.token);
    const action = cleanString(body.action);

    if (!token) {
      return NextResponse.json({ error: "Missing token." }, { status: 400 });
    }

    if (!["confirm", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("location_reservations")
      .select("*")
      .eq("customer_token", token)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    if (isExpired(existing.customer_token_expires_at)) {
      return NextResponse.json(
        { error: "This reservation link has expired." },
        { status: 410 }
      );
    }

    if (existing.status === "cancelled") {
      return NextResponse.json(
        { error: "This reservation is already cancelled." },
        { status: 400 }
      );
    }

    const update =
      action === "confirm"
        ? {
            customer_confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            status: "cancelled",
            customer_cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

    const { data, error } = await supabaseAdmin
      .from("location_reservations")
      .update(update)
      .eq("customer_token", token)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reservation: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Something went wrong." },
      { status: 500 }
    );
  }
}