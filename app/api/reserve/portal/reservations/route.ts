import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const allowedStatuses = [
  "pending",
  "confirmed",
  "arrived",
  "declined",
  "cancelled",
  "completed",
  "no_show",
];

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeType(value: string) {
  const type = value.toLowerCase().trim();

  if (["activity", "activities"].includes(type)) return "activity";
  if (["bar", "bars"].includes(type)) return "bar";
  if (["lounge", "lounges"].includes(type)) return "lounge";
  if (["venue", "venues"].includes(type)) return "venue";

  return "restaurant";
}

function normalizeStatus(value: string) {
  const status = value.toLowerCase().trim();
  return allowedStatuses.includes(status) ? status : "";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const locationId = cleanString(searchParams.get("locationId"));
    const locationType = normalizeType(
      cleanString(searchParams.get("type")) || "restaurant"
    );
    const status = normalizeStatus(cleanString(searchParams.get("status")));

    if (!locationId) {
      return NextResponse.json(
        { error: "Missing locationId." },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("location_reservations")
      .select("*")
      .eq("location_id", locationId)
      .eq("location_type", locationType)
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true })
      .order("created_at", { ascending: false });

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