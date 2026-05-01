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
  let query = "restaurants in Queens NY";
  let imported = 0;
  let skipped = 0;

  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: missing token" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token);

    if (userError || !user?.email) {
      return NextResponse.json(
        { error: "Unauthorized: invalid user" },
        { status: 401 }
      );
    }

    const { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("role")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    if (!adminUser || !["superuser", "admin"].includes(adminUser.role)) {
      return NextResponse.json(
        { error: "Unauthorized: not admin" },
        { status: 401 }
      );
    }

    const body = await req.json();
    query = body.query || query;

    const googleKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!googleKey) {
      return NextResponse.json(
        { error: "Missing GOOGLE_PLACES_API_KEY" },
        { status: 500 }
      );
    }

    const googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${googleKey}`;

    const googleRes = await fetch(googleUrl);
    const googleData = await googleRes.json();

    if (!googleData.results || !Array.isArray(googleData.results)) {
      return NextResponse.json(
        {
          error: "No Google results found",
          googleStatus: googleData.status,
          googleMessage: googleData.error_message,
        },
        { status: 400 }
      );
    }

    for (const place of googleData.results.slice(0, 20)) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from("restaurants")
        .select("id")
        .eq("google_place_id", place.place_id)
        .maybeSingle();

      if (existingError) {
        throw new Error(`Duplicate check failed: ${existingError.message}`);
      }

      if (existing) {
        skipped++;
        continue;
      }

      const photoUrl = place.photos?.[0]?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${place.photos[0].photo_reference}&key=${googleKey}`
        : null;

      const { error: insertError } = await supabaseAdmin
        .from("restaurants")
        .insert({
          restaurant_name: place.name || "Unnamed Restaurant",
          address: place.formatted_address || "",
          google_place_id: place.place_id,
          rating: Number(place.rating || 0),
          user_ratings_total: Number(place.user_ratings_total || 0),
          image_url: photoUrl,
          source: "google",
          claim_status: "unclaimed",
          roseout_score: Number(place.rating || 0) * 20,
          view_count: 0,
          click_count: 0,
        });

      if (insertError) {
        throw new Error(`Restaurant insert failed: ${insertError.message}`);
      }

      imported++;
    }

    const today = new Date().toISOString().split("T")[0];

    await supabaseAdmin.from("import_logs").insert({
      job_name: "Google Import",
      run_date: today,
      imported_count: imported,
    });

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      totalGoogleResults: googleData.results.length,
      query,
    });
  } catch (error: any) {
    const today = new Date().toISOString().split("T")[0];

    await supabaseAdmin.from("import_logs").insert({
      job_name: "Google Import Failed",
      run_date: today,
      imported_count: imported,
    });

    return NextResponse.json(
      {
        error: error.message || "Import failed",
        imported,
        skipped,
        query,
      },
      { status: 500 }
    );
  }
}