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

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  return authHeader.slice(7).trim();
}

async function isAdminBearerToken(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return false;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user?.email) return false;

  const { data: adminUser } = await supabaseAdmin
    .from("admin_users")
    .select("id")
    .eq("email", data.user.email.toLowerCase())
    .in("role", ["superuser", "admin", "editor"])
    .maybeSingle();

  return !!adminUser;
}

async function isAuthorized(request: NextRequest) {
  if (process.env.NODE_ENV === "development") return true;

  const headerSecret = request.headers.get("x-internal-import-secret");
  const bearerToken = getBearerToken(request);

  if (process.env.IMPORT_SECRET && headerSecret === process.env.IMPORT_SECRET) {
    return true;
  }

  if (process.env.CRON_SECRET && bearerToken === process.env.CRON_SECRET) {
    return true;
  }

  return isAdminBearerToken(request);
}

async function fetchGooglePlaces(query: string, limit = 20) {
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

  if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || `Google Places error: ${data.status}`);
  }

  return (data.results || []).slice(0, limit);
}

async function importRestaurant(place: any) {
  const { data: existing } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("google_place_id", place.place_id)
    .maybeSingle();

  if (existing) return { imported: false, skipped: true };

  const claimQr = await createClaimQr("restaurant");

  const { error } = await supabaseAdmin.from("restaurants").insert({
    restaurant_name: place.name,
    address: place.formatted_address || null,
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
    ...claimQr,
  });

  if (error) throw new Error(error.message);

  return { imported: true, skipped: false };
}

async function importActivity(place: any) {
  const { data: existing } = await supabaseAdmin
    .from("activities")
    .select("id")
    .eq("google_place_id", place.place_id)
    .maybeSingle();

  if (existing) return { imported: false, skipped: true };

  const claimQr = await createClaimQr("activity");

  const { error } = await supabaseAdmin.from("activities").insert({
    activity_name: place.name,
    activity_type: place.types?.[0] || "activity",
    address: place.formatted_address || null,
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
    ...claimQr,
  });

  if (error) throw new Error(error.message);

  return { imported: true, skipped: false };
}

async function logImport() {
  await supabaseAdmin.from("import_logs").insert({
    job_name: "Google Import",
    run_date: new Date().toISOString().split("T")[0],
  });
}

async function runImport({
  query = "restaurants in Queens NY",
  type = "restaurant",
  limit = 20,
}: {
  query?: string;
  type?: ImportType;
  limit?: number;
}) {
  const places = await fetchGooglePlaces(query, limit);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const place of places) {
    try {
      const result =
        type === "activity"
          ? await importActivity(place)
          : await importRestaurant(place);

      if (result.imported) imported++;
      if (result.skipped) skipped++;
    } catch (error) {
      failed++;
      console.error("Import item failed:", error);
    }
  }

  await logImport();

  return {
    success: true,
    type,
    query,
    total_found: places.length,
    imported,
    skipped,
    failed,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;

    const result = await runImport({
      query: params.get("query") || "restaurants in Queens NY",
      type: params.get("type") === "activity" ? "activity" : "restaurant",
      limit: Number(params.get("limit") || 20),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const result = await runImport({
      query: body.query || "restaurants in Queens NY",
      type: body.type === "activity" ? "activity" : "restaurant",
      limit: Number(body.limit || 20),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}