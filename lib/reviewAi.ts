// lib/reviewAi.ts

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export type ReviewAnalysis = {
  keywords: string[];
  sentiment: "positive" | "neutral" | "negative";
  vibe:
    | "romantic"
    | "fun"
    | "chill"
    | "upscale"
    | "casual"
    | "trendy"
    | "cozy"
    | "lively"
    | "intimate"
    | "classy"
    | "energetic";
  noise_level: "quiet" | "moderate" | "loud" | "very loud";
  date_night: boolean;
  group_friendly: boolean;
  family_friendly: boolean;
  occasion_fit: string[];
  service_quality: "excellent" | "good" | "average" | "bad" | "mixed";
  food_quality: "excellent" | "good" | "average" | "bad" | "mixed";
  ambiance_quality: "excellent" | "good" | "average" | "bad" | "mixed";
  price_feeling: "worth it" | "overpriced" | "affordable" | "fair" | "expensive";
  wait_time: "short" | "normal" | "long" | "unknown";
  reservation_recommended: boolean;
  best_for: string[];
  avoid_if: string[];
  score_boost: number;
};

function cleanJson(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function clampScore(value: unknown) {
  if (typeof value !== "number") return 0;
  return Math.max(-10, Math.min(10, value));
}

export async function analyzeReview(
  reviewText: string
): Promise<ReviewAnalysis> {
  const prompt = `
You are analyzing a full-sentence customer review for RoseOut, an AI date night and outing planner.

Extract structured data from the review.

Return valid JSON only. No markdown. No explanation.

Use this exact JSON structure:

{
  "keywords": ["romantic", "loud", "fun"],
  "sentiment": "positive",
  "vibe": "romantic",
  "noise_level": "moderate",
  "date_night": true,
  "group_friendly": true,
  "family_friendly": false,
  "occasion_fit": ["first date", "anniversary"],
  "service_quality": "good",
  "food_quality": "good",
  "ambiance_quality": "excellent",
  "price_feeling": "worth it",
  "wait_time": "normal",
  "reservation_recommended": true,
  "best_for": ["romantic dinner", "upscale date"],
  "avoid_if": ["you want a quiet place"],
  "score_boost": 6
}

Rules:
- keywords must be short customer-style phrases.
- sentiment must be: positive, neutral, or negative.
- vibe must be one of: romantic, fun, chill, upscale, casual, trendy, cozy, lively, intimate, classy, energetic.
- noise_level must be one of: quiet, moderate, loud, very loud.
- service_quality, food_quality, and ambiance_quality must be one of: excellent, good, average, bad, mixed.
- price_feeling must be one of: worth it, overpriced, affordable, fair, expensive.
- wait_time must be one of: short, normal, long, unknown.
- occasion_fit, best_for, and avoid_if must be arrays.
- score_boost must be a number from -10 to 10.
- If the review does not mention something clearly, use a safe default.

Customer review:
"${reviewText}"
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  const text = completion.choices[0]?.message?.content || "{}";

  try {
    const parsed = JSON.parse(cleanJson(text));

    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      sentiment: parsed.sentiment || "neutral",
      vibe: parsed.vibe || "casual",
      noise_level: parsed.noise_level || "moderate",
      date_night: Boolean(parsed.date_night),
      group_friendly: Boolean(parsed.group_friendly),
      family_friendly: Boolean(parsed.family_friendly),
      occasion_fit: Array.isArray(parsed.occasion_fit)
        ? parsed.occasion_fit
        : [],
      service_quality: parsed.service_quality || "mixed",
      food_quality: parsed.food_quality || "mixed",
      ambiance_quality: parsed.ambiance_quality || "mixed",
      price_feeling: parsed.price_feeling || "fair",
      wait_time: parsed.wait_time || "unknown",
      reservation_recommended: Boolean(parsed.reservation_recommended),
      best_for: Array.isArray(parsed.best_for) ? parsed.best_for : [],
      avoid_if: Array.isArray(parsed.avoid_if) ? parsed.avoid_if : [],
      score_boost: clampScore(parsed.score_boost),
    };
  } catch {
    return {
      keywords: [],
      sentiment: "neutral",
      vibe: "casual",
      noise_level: "moderate",
      date_night: false,
      group_friendly: false,
      family_friendly: false,
      occasion_fit: [],
      service_quality: "mixed",
      food_quality: "mixed",
      ambiance_quality: "mixed",
      price_feeling: "fair",
      wait_time: "unknown",
      reservation_recommended: false,
      best_for: [],
      avoid_if: [],
      score_boost: 0,
    };
  }
}