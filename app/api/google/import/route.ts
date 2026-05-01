import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: missing token" }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token);

    if (userError || !user?.email) {
      return NextResponse.json({ error: "Unauthorized: invalid user" }, { status: 401 });
    }

    const { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("role")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    if (!adminUser || !["superuser", "admin"].includes(adminUser.role)) {
      return NextResponse.json({ error: "Unauthorized: not admin" }, { status: 401 });
    }

    const body = await req.json();
    const query = body.query || "restaurants in Queens NY";

    const googleKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!googleKey) {
      return NextResponse.json({ error: "Missing Google API key" }, { status: 500 });
    }

    const googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${googleKey}`;

    const googleRes = await fetch(googleUrl);
    const googleData = await googleRes.json();

    if (!googleData.results) {
      return NextResponse.json({ error: "No Google results found" }, { status: 400 });
    }

    let imported = 0;

    for (const place of googleData.results.slice(0, 20)) {
      const { data: existing } = await supabaseAdmin
        .from("restaurants")
        .select("id")
        .eq("google_place_id", place.place_id)
        .maybeSingle();

      if (existing) continue;

      await supabaseAdmin.from("restaurants").insert({
        restaurant_name: place.name,
        address: place.formatted_address || "",
        google_place_id: place.place_id,
        rating: place.rating || 0,
        user_ratings_total: place.user_ratings_total || 0,
        image_url: place.photos?.[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${place.photos[0].photo_reference}&key=${googleKey}`
          : null,
        source: "google",
        claim_status: "unclaimed",
      });

      imported++;
    }

    await supabaseAdmin.from("import_history").insert({
      source: "google",
      query,
      imported_count: imported,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      imported,
      query,
    });
  } catch (error: any) {
    await supabaseAdmin.from("import_history").insert({
      source: "google",
      query: "unknown",
      imported_count: 0,
      status: "failed",
      error_message: error.message || "Import failed",
    });

    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}