import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(value: string) {
  const status = value.toLowerCase().trim();

  if (
    ["pending", "confirmed", "declined", "cancelled", "completed", "no_show"].includes(
      status
    )
  ) {
    return status;
  }

  return "";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const locationId = cleanString(searchParams.get("locationId"));
    const locationType = cleanString(searchParams.get("type")) || "restaurant";
    const status = normalizeStatus(cleanString(searchParams.get("status")));

    let query = supabaseAdmin
      .from("location_reservations")
      .select("*")
      .eq("location_id", locationId)
      .eq("location_type", locationType)
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true })
      .order("created_at", { ascending: false });

    if (!locationId) {
      return NextResponse.json(
        { error: "Missing locationId." },
        { status: 400 }
      );
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      reservations: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Something went wrong." },
      { status: 500 }
    );
  }
}