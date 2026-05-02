import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClaimQr } from "@/lib/claimQr";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ImportType = "restaurant" | "activity";

function getGoogleKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  );
}

async function fetchGooglePlaces(query: string) {
  const apiKey = getGoogleKey();

  if (!apiKey) throw new Error("Missing Google API key");

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/textsearch/json"
  );

  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();

  if (!res.ok) throw new Error("Google request failed");

  return data.results || [];
}

async function importRestaurant(place: any) {
  const claimQr = await createClaimQr("restaurant");

  const { data: existing } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("google_place_id", place.place_id)
    .maybeSingle();

  if (existing) return { imported: false, skipped: true };

  const { error } = await supabaseAdmin.from("restaurants").insert({
    restaurant_name: place.name,
    address: place.formatted_address,
    city: null,
    state: null,
    zip_code: null,
    cuisine: place.types?.join(", ") || null,
    rating: place.rating || 0,
    google_place_id: place.place_id,
    image_url: null,
    status: "approved",
    claimed: false,
    view_count: 0,
    click_count: 0,
    claim_count: 0,

    // 🔥 THIS IS THE FIX
    ...claimQr,
  });

  if (error) throw new Error(error.message);

  return { imported: true, skipped: false };
}

async function importActivity(place: any) {
  const claimQr = await createClaimQr("activity");

  const { data: existing } = await supabaseAdmin
    .from("activities")
    .select("id")
    .eq("google_place_id", place.place_id)
    .maybeSingle();

  if (existing) return { imported: false, skipped: true };

  const { error } = await supabaseAdmin.from("activities").insert({
    activity_name: place.name,
    activity_type: place.types?.[0] || "activity",
    address: place.formatted_address,
    city: null,
    state: null,
    zip_code: null,
    rating: place.rating || 0,
    google_place_id: place.place_id,
    image_url: null,
    status: "approved",
    claimed: false,
    view_count: 0,
    click_count: 0,
    claim_count: 0,

    // 🔥 THIS IS THE FIX
    ...claimQr,
  });

  if (error) throw new Error(error.message);

  return { imported: true, skipped: false };
}

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-internal-import-secret");

    if (
      process.env.NODE_ENV !== "development" &&
      secret !== process.env.IMPORT_SECRET
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const query = body.query || "restaurants in Queens NY";
    const type: ImportType =
      body.type === "activity" ? "activity" : "restaurant";

    const places = await fetchGooglePlaces(query);

    let imported = 0;
    let skipped = 0;

    for (const place of places) {
      try {
        const result =
          type === "activity"
            ? await importActivity(place)
            : await importRestaurant(place);

        if (result.imported) imported++;
        if (result.skipped) skipped++;
      } catch (e) {
        console.error("Import error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      type,
      imported,
      skipped,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}