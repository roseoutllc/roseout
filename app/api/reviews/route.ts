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

    const cleanReview = String(review_text).trim();

    if (cleanReview.length < 30) {
      return NextResponse.json(
        { error: "Please leave a full-sentence review with more detail." },
        { status: 400 }
      );
    }

    const ai = await analyzeReview(cleanReview);

    const safeKeywords = Array.isArray(ai.keywords) ? ai.keywords : [];
    const safeOccasionFit = Array.isArray(ai.occasion_fit)
      ? ai.occasion_fit
      : [];
    const safeBestFor = Array.isArray(ai.best_for) ? ai.best_for : [];
    const safeAvoidIf = Array.isArray(ai.avoid_if) ? ai.avoid_if : [];

    const safeScoreBoost = Math.min(
      10,
      Math.max(-10, Number(ai.score_boost || 0))
    );

    const { error: insertError } = await supabaseAdmin
      .from("location_reviews")
      .insert({
        location_id,
        customer_name: customer_name || "Guest",
        rating: Number(rating),
        review_text: cleanReview,

        ai_keywords: safeKeywords,
        ai_sentiment: ai.sentiment || "neutral",
        ai_score_boost: safeScoreBoost,

        vibe: ai.vibe || "casual",
        noise_level: ai.noise_level || "moderate",
        date_night: Boolean(ai.date_night),
        group_friendly: Boolean(ai.group_friendly),
        family_friendly: Boolean(ai.family_friendly),
        occasion_fit: safeOccasionFit,
        service_quality: ai.service_quality || "mixed",
        food_quality: ai.food_quality || "mixed",
        ambiance_quality: ai.ambiance_quality || "mixed",
        price_feeling: ai.price_feeling || "fair",
        wait_time: ai.wait_time || "unknown",
        reservation_recommended: Boolean(ai.reservation_recommended),
        best_for: safeBestFor,
        avoid_if: safeAvoidIf,
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
    const uniqueKeywords = Array.from(new Set(allKeywords)).slice(0, 30);

    const reviewScore = Math.round(
      Math.min(100, Math.max(0, avgRating * 20 + avgBoost))
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
      ai,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}