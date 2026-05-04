import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = cleanString(searchParams.get("token"));

    if (!token) {
      return NextResponse.json(
        { error: "Missing token." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("location_reservations")
      .select("*")
      .eq("customer_token", token)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      reservation: data,
    });
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
      return NextResponse.json(
        { error: "Missing token." },
        { status: 400 }
      );
    }

    if (!["confirm", "cancel"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action." },
        { status: 400 }
      );
    }

    // Get existing reservation
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("location_reservations")
      .select("*")
      .eq("customer_token", token)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    // Prevent actions on cancelled reservations
    if (existing.status === "cancelled") {
      return NextResponse.json(
        { error: "This reservation is already cancelled." },
        { status: 400 }
      );
    }

    let update: any = {};

    if (action === "confirm") {
      update = {
        customer_confirmed_at: new Date().toISOString(),
      };
    }

    if (action === "cancel") {
      update = {
        status: "cancelled",
        customer_cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const { data, error } = await supabaseAdmin
      .from("location_reservations")
      .update(update)
      .eq("customer_token", token)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
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