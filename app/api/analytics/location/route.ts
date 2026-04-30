import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function calculateScore(item: any) {
  const rating = Number(item.rating || 0);
  const reviewCount = Number(item.review_count || 0);
  const viewCount = Number(item.view_count || 0);
  const clickCount = Number(item.click_count || 0);
  const qualityScore = Number(item.quality_score || 0);
  const popularityScore = Number(item.popularity_score || 0);

  return Number(
    (
      rating * 20 +
      reviewCount * 0.15 +
      viewCount * 0.05 +
      clickCount * 0.25 +
      qualityScore * 0.3 +
      popularityScore * 0.3
    ).toFixed(2)
  );
}

export async function POST(req: NextRequest) {
  try {
    const { id, type, event } = await req.json();

    if (!id || !type || !event) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const table =
      type === "restaurant"
        ? "restaurants"
        : type === "activity"
        ? "activities"
        : null;

    if (!table) {
      return NextResponse.json(
        { error: "Invalid location type." },
        { status: 400 }
      );
    }

    const field =
      event === "view"
        ? "view_count"
        : event === "click"
        ? "click_count"
        : null;

    if (!field) {
      return NextResponse.json(
        { error: "Invalid analytics event." },
        { status: 400 }
      );
    }

    const { data: item, error: fetchError } = await supabaseAdmin
      .from(table)
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json(
        { error: "Location not found." },
        { status: 404 }
      );
    }

    const updatedValue = Number((item as Record<string, any>)[field] || 0) + 1;

    const updatedItem = {
      ...item,
      [field]: updatedValue,
    };

    const newScore = calculateScore(updatedItem);

    const { error: updateError } = await supabaseAdmin
      .from(table)
      .update({
        [field]: updatedValue,
        roseout_score: newScore,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event,
      type,
      updated_count: updatedValue,
      roseout_score: newScore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}