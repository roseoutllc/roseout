// app/api/reviews/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { analyzeReview } from "@/lib/reviewAi";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { location_id, customer_name, rating, review_text } = body;

    if (!location_id || !rating || !review_text) {
      return NextResponse.json(
        { error: "Missing required review fields." },
        { status: 400 }
      );
    }

    if (review_text.trim().length < 30) {
      return NextResponse.json(
        { error: "Please leave a full-sentence review with more detail." },
        { status: 400 }
      );
    }

    const ai = await analyzeReview(review_text);

    const { error: insertError } = await supabaseAdmin
      .from("location_reviews")
      .insert({
        location_id,
        customer_name,
        rating,
        review_text,

        ai_keywords: ai.keywords,
        ai_sentiment: ai.sentiment,
        ai_score_boost: ai.score_boost,

        vibe: ai.vibe,
        noise_level: ai.noise_level,
        date_night: ai.date_night,
        group_friendly: ai.group_friendly,
        family_friendly: ai.family_friendly,
        occasion_fit: ai.occasion_fit,
        service_quality: ai.service_quality,
        food_quality: ai.food_quality,
        ambiance_quality: ai.ambiance_quality,
        price_feeling: ai.price_feeling,
        wait_time: ai.wait_time,
        reservation_recommended: ai.reservation_recommended,
        best_for: ai.best_for,
        avoid_if: ai.avoid_if,
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const { data: reviews, error: reviewError } = await supabaseAdmin
      .from("location_reviews")
      .select("rating, ai_keywords, ai_score_boost")
      .eq("location_id", location_id);

    if (reviewError) {
      return NextResponse.json(
        { error: reviewError.message },
        { status: 500 }
      );
    }

    const reviewCount = reviews?.length || 0;

    const avgRating =
      reviewCount > 0
        ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
          reviewCount
        : 0;

    const avgBoost =
      reviewCount > 0
        ? reviews.reduce(
            (sum, r) => sum + Number(r.ai_score_boost || 0),
            0
          ) / reviewCount
        : 0;

    const allKeywords = reviews?.flatMap((r) => r.ai_keywords || []) || [];
    const uniqueKeywords = Array.from(new Set(allKeywords));

    const reviewScore = Math.min(
      100,
      Math.max(0, avgRating * 20 + avgBoost)
    );

    const { error: updateError } = await supabaseAdmin
      .from("locations")
      .update({
        review_score: reviewScore,
        review_keywords: uniqueKeywords,
        review_count: reviewCount,
      })
      .eq("id", location_id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      location_id,
      review_score: reviewScore,
      review_count: reviewCount,
      keywords: uniqueKeywords,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}