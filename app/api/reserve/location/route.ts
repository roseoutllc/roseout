import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

function getTableName(type: string) {
  return type === "activity" ? "activities" : "locations";
}

function getLocationName(location: any, type: string) {
  if (!location) return "RoseOut Location";

  if (type === "activity") {
    return (
      location.activity_name ||
      location.location_name ||
      location.business_name ||
      location.title ||
      "RoseOut Activity"
    );
  }

  return (
    location.restaurant_name ||
    location.name ||
    location.location_name ||
    location.business_name ||
    "RoseOut Location"
  );
}

function getAddress(location: any) {
  return [
    location?.address,
    location?.city,
    location?.state,
    location?.zip_code,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const locationId = searchParams.get("locationId");
    const locationType = normalizeType(searchParams.get("type") || "restaurant");

    if (!locationId) {
      return NextResponse.json(
        { error: "Missing locationId." },
        { status: 400 }
      );
    }

    const { data: location, error: locationError } = await supabaseAdmin
      .from(getTableName(locationType))
      .select("*")
      .eq("id", locationId)
      .maybeSingle();

    if (locationError) {
      return NextResponse.json(
        { error: locationError.message },
        { status: 500 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { error: "Location not found." },
        { status: 404 }
      );
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("location_bookable_items")
      .select("*")
      .eq("location_id", locationId)
      .eq("location_type", locationType)
      .eq("is_active", true)
      .order("capacity_min", { ascending: true })
      .order("item_name", { ascending: true });

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({
      location: {
        id: locationId,
        type: locationType,
        name: getLocationName(location, locationType),
        address: getAddress(location),
        image_url:
          location.image_url ||
          location.photo_url ||
          location.image ||
          null,
        category:
          location.cuisine ||
          location.activity_type ||
          location.category ||
          location.location_type ||
          locationType,
      },
      items: items || [],
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

    const locationId = cleanString(body.location_id);
    const locationType = normalizeType(cleanString(body.location_type));

    const customerName = cleanString(body.customer_name);
    const customerEmail = cleanString(body.customer_email);
    const customerPhone = cleanString(body.customer_phone);

    const reservationDate = cleanString(body.reservation_date);
    const reservationTime = cleanString(body.reservation_time);
    const specialRequest = cleanString(body.special_request);

    const partySize = Number(body.party_size || 2);
    const bookableItemId = cleanString(body.bookable_item_id);

    if (!locationId) {
      return NextResponse.json(
        { error: "Missing location." },
        { status: 400 }
      );
    }

    if (!customerName) {
      return NextResponse.json(
        { error: "Please enter your name." },
        { status: 400 }
      );
    }

    if (!customerPhone && !customerEmail) {
      return NextResponse.json(
        { error: "Please enter a phone number or email." },
        { status: 400 }
      );
    }

    if (!reservationDate || !reservationTime) {
      return NextResponse.json(
        { error: "Please select a date and time." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(partySize) || partySize < 1) {
      return NextResponse.json(
        { error: "Please enter a valid party size." },
        { status: 400 }
      );
    }

    let selectedItem: any = null;

    if (bookableItemId) {
      const { data: item, error: itemError } = await supabaseAdmin
        .from("location_bookable_items")
        .select("*")
        .eq("id", bookableItemId)
        .eq("location_id", locationId)
        .eq("location_type", locationType)
        .eq("is_active", true)
        .maybeSingle();

      if (itemError) {
        return NextResponse.json({ error: itemError.message }, { status: 500 });
      }

      if (!item) {
        return NextResponse.json(
          { error: "Selected reservation option is no longer available." },
          { status: 400 }
        );
      }

      if (
        partySize < Number(item.capacity_min || 1) ||
        partySize > Number(item.capacity_max || 999)
      ) {
        return NextResponse.json(
          { error: "This reservation option does not fit your party size." },
          { status: 400 }
        );
      }

      selectedItem = item;
    }

    const { data: reservation, error } = await supabaseAdmin
      .from("location_reservations")
      .insert({
        location_id: locationId,
        location_type: locationType,

        bookable_item_id: selectedItem?.id || null,
        bookable_item_name: selectedItem?.item_name || null,
        bookable_item_type: selectedItem?.item_type || null,

        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,

        reservation_date: reservationDate,
        reservation_time: reservationTime,
        party_size: partySize,

        special_request: specialRequest || null,
        status: "pending",
        source: "roseout",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reservation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Something went wrong." },
      { status: 500 }
    );
  }
}