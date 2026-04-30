import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("restaurants")
      .select(
        `
        *,
        restaurant_claims (
          id,
          status,
          owner_name,
          owner_email,
          owner_phone,
          created_at
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching restaurants:", error);

      return NextResponse.json(
        { error: "Failed to load restaurants" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      restaurants: data || [],
    });
  } catch (err) {
    console.error("Server error:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}