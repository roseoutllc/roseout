import { detectChainBrand } from "@/lib/location-growth/chainDetection";

export type GoogleDiscoveryKind = "restaurant" | "activity";
export type GoogleDiscoveryDecision = "auto_import" | "review" | "reject";
export type ActivityCategoryEvidence = "supported" | "missing" | "mismatch";

export type GoogleDiscoveryQualityInput = {
  kind: GoogleDiscoveryKind;
  name: string;
  query: string;
  category: string;
  rating: number;
  reviewCount: number;
  types?: string[];
  editorialSummary?: string | null;
  hasPhoto: boolean;
  hasPhone: boolean;
  hasWebsite: boolean;
  hasHours: boolean;
  hasLocation: boolean;
  dineIn?: boolean | null;
  takeout?: boolean | null;
  delivery?: boolean | null;
  curbsidePickup?: boolean | null;
  reservable?: boolean | null;
  goodForGroups?: boolean | null;
  outdoorSeating?: boolean | null;
  liveMusic?: boolean | null;
  servesCocktails?: boolean | null;
  servesWine?: boolean | null;
};

export type GoogleDiscoveryQualityResult = {
  decision: GoogleDiscoveryDecision;
  score: number;
  outingFitScore: number;
  reasons: string[];
  chainBrand: string | null;
  quickService: boolean;
  categoryEvidence: ActivityCategoryEvidence;
  thresholds: {
    autoMinRating: number;
    autoMinReviews: number;
    reviewMinRating: number;
    reviewMinReviews: number;
  };
};

const QUICK_SERVICE_TYPES = new Set([
  "fast_food_restaurant",
  "food_court",
  "meal_delivery",
  "food_delivery",
  "pizza_delivery",
]);

const TAKEAWAY_TYPES = new Set([
  "meal_takeaway",
  "sandwich_shop",
  "hamburger_restaurant",
  "pizza_restaurant",
]);

const DESTINATION_TYPES = new Set([
  "fine_dining_restaurant",
  "steak_house",
  "seafood_restaurant",
  "sushi_restaurant",
  "wine_bar",
  "cocktail_bar",
  "bar",
  "night_club",
  "event_venue",
]);

const QUICK_SERVICE_NAME_TERMS = [
  "fried chicken",
  "chicken fingers",
  "chicken fries",
  "loaded platters",
  "smashburger",
  "smash burger",
  "wings and pizza",
  "hot wings",
];

const NICHE_ACTIVITY_CATEGORIES = new Set([
  "paint_and_sip",
  "pottery",
  "candle_making",
  "glassblowing",
  "tufting",
  "perfume_making",
  "jewelry_making",
  "cooking_class",
  "pasta_making",
  "sushi_class",
  "mixology_class",
  "chocolate_making",
  "rage_room",
  "archery",
  "virtual_reality",
  "racing_simulator",
  "woodworking",
  "forging",
  "floral_workshop",
  "aerial_class",
  "immersive",
]);

const ARCADE_STRONG_TYPES = new Set([
  "video_arcade",
  "amusement_center",
  "amusement_park",
]);

const ARCADE_OBVIOUS_MISMATCH_TYPES = new Set([
  "shopping_mall",
  "manufacturer",
  "supplier",
  "toy_store",
  "store",
]);

const OUTING_SIGNALS: Array<[RegExp, number, string]> = [
  [/rooftop/, 18, "rooftop"],
  [/waterfront|water view|river view|harbor|harbour/, 18, "waterfront"],
  [/fine dining|omakase|tasting menu/, 16, "elevated_dining"],
  [/live music|jazz|concert/, 16, "live_entertainment"],
  [/private dining|private room|event venue/, 14, "group_occasion"],
  [/speakeasy|hidden bar|secret bar/, 18, "speakeasy"],
  [/hookah|shisha/, 18, "hookah_destination"],
  [/cocktail|wine bar|mixology/, 12, "drinks_destination"],
  [/night club|nightclub|lounge|bar/, 9, "nightlife_destination"],
  [/romantic|date night|date-night/, 12, "date_night"],
  [/birthday|celebration|group dining/, 10, "celebration"],
  [/steakhouse|steak house|seafood|sushi|izakaya/, 8, "destination_food"],
  [/brunch/, 6, "brunch"],
  [/escape room|bowling|arcade|mini golf|axe throwing|karaoke|go kart|virtual reality|rage room|archery|racing simulator/, 22, "interactive_activity"],
  [/comedy club|museum|art gallery|immersive|paint and sip|pottery|candle making|glassblowing|tufting|perfume making|jewelry making|cooking class|pasta making|sushi class|mixology class|chocolate making|woodworking|forging|floral workshop|aerial/, 20, "experience_activity"],
  [/spa|bath house|sauna|wellness/, 18, "wellness_activity"],
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasStructuredDestinationSignal(input: GoogleDiscoveryQualityInput) {
  return Boolean(
    input.dineIn === true ||
      input.reservable === true ||
      input.goodForGroups === true ||
      input.outdoorSeating === true ||
      input.liveMusic === true ||
      input.servesCocktails === true ||
      input.servesWine === true,
  );
}

function hasDestinationType(types: string[]) {
  return types.some((type) => DESTINATION_TYPES.has(type));
}

export function activityCategoryEvidence(input: Pick<GoogleDiscoveryQualityInput, "kind" | "category" | "name" | "types" | "editorialSummary">): ActivityCategoryEvidence {
  if (input.kind !== "activity") return "supported";
  if (input.category !== "arcade") return "supported";

  const types = (input.types || []).map((type) => String(type).toLowerCase());
  const text = normalize([input.name, input.editorialSummary].join(" "));
  const explicitArcadeText = /\bbarcade\b|\barcade\b|video arcade|gaming lounge|esports (arena|center|centre)|pinball arcade/.test(text);
  if (explicitArcadeText || types.some((type) => ARCADE_STRONG_TYPES.has(type))) return "supported";

  const primaryType = types[0] || "";
  if (ARCADE_OBVIOUS_MISMATCH_TYPES.has(primaryType)) return "mismatch";
  return "missing";
}

export function isQuickServiceDiscoveryCandidate(input: Pick<GoogleDiscoveryQualityInput, "name" | "types" | "dineIn" | "takeout" | "delivery" | "curbsidePickup" | "reservable" | "goodForGroups" | "outdoorSeating" | "liveMusic" | "servesCocktails" | "servesWine">) {
  const types = (input.types || []).map((type) => String(type).toLowerCase());
  const destination = hasStructuredDestinationSignal(input as GoogleDiscoveryQualityInput) || hasDestinationType(types);
  if (input.dineIn === false && (input.takeout === true || input.delivery === true || input.curbsidePickup === true) && !destination) return true;
  if (types.some((type) => QUICK_SERVICE_TYPES.has(type)) && !destination) return true;
  const text = normalize(input.name);
  const quickName = QUICK_SERVICE_NAME_TERMS.some((term) => text.includes(term));
  const takeawaySignals = types.filter((type) => TAKEAWAY_TYPES.has(type)).length;
  return quickName && takeawaySignals > 0 && !destination;
}

export function calculateOutingFitScore(input: GoogleDiscoveryQualityInput) {
  const searchable = normalize([input.name, input.editorialSummary, ...(input.types || [])].join(" "));
  let score = 0;
  const reasons: string[] = [];
  for (const [pattern, points, reason] of OUTING_SIGNALS) {
    if (!pattern.test(searchable)) continue;
    score += points;
    reasons.push(reason);
  }
  if (input.kind === "activity") {
    score += 12;
    reasons.push("activity_destination");
  } else if ((input.types || []).some((type) => type.includes("restaurant"))) {
    score += 5;
    reasons.push("full_service_food");
  }
  if (input.kind === "restaurant") {
    if (input.dineIn === true) { score += 7; reasons.push("dine_in"); }
    if (input.reservable === true) { score += 8; reasons.push("reservable"); }
    if (input.goodForGroups === true) { score += 4; reasons.push("group_friendly"); }
    if (input.outdoorSeating === true) { score += 3; reasons.push("outdoor_seating"); }
    if (input.liveMusic === true) { score += 8; reasons.push("live_music"); }
    if (input.servesCocktails === true || input.servesWine === true) { score += 4; reasons.push("drinks_service"); }
  }
  return { score: clamp(score, 0, 50), reasons: Array.from(new Set(reasons)) };
}

function thresholdsFor(input: GoogleDiscoveryQualityInput) {
  if (input.kind === "restaurant" && input.category === "hidden_gem") {
    return { autoMinRating: 4.6, autoMinReviews: 50, reviewMinRating: 4.4, reviewMinReviews: 25 };
  }
  if (input.kind === "activity" && NICHE_ACTIVITY_CATEGORIES.has(input.category)) {
    return { autoMinRating: 4.5, autoMinReviews: 50, reviewMinRating: 4.3, reviewMinReviews: 20 };
  }
  return input.kind === "restaurant"
    ? { autoMinRating: 4.4, autoMinReviews: 200, reviewMinRating: 4.2, reviewMinReviews: 75 }
    : { autoMinRating: 4.4, autoMinReviews: 100, reviewMinRating: 4.2, reviewMinReviews: 40 };
}

function result(input: {
  decision: GoogleDiscoveryDecision;
  score: number;
  outingFitScore: number;
  reasons: string[];
  chainBrand: string | null;
  quickService: boolean;
  categoryEvidence: ActivityCategoryEvidence;
  thresholds: GoogleDiscoveryQualityResult["thresholds"];
}): GoogleDiscoveryQualityResult {
  return { ...input, reasons: Array.from(new Set(input.reasons)) };
}

export function evaluateGoogleDiscoveryCandidate(input: GoogleDiscoveryQualityInput): GoogleDiscoveryQualityResult {
  const reasons: string[] = [];
  const chain = detectChainBrand(input.name);
  const quickService = isQuickServiceDiscoveryCandidate(input);
  const thresholds = thresholdsFor(input);
  const hiddenGem = input.kind === "restaurant" && input.category === "hidden_gem";
  const categoryEvidence = activityCategoryEvidence(input);

  if (!Number.isFinite(input.rating) || input.rating <= 0) reasons.push("missing_rating");
  if (!Number.isFinite(input.reviewCount) || input.reviewCount <= 0) reasons.push("missing_reviews");
  if (input.rating > 0 && input.rating < thresholds.reviewMinRating) reasons.push("rating_below_floor");
  if (input.reviewCount > 0 && input.reviewCount < Math.min(25, thresholds.reviewMinReviews)) reasons.push("reviews_below_floor");
  if (chain.isChain) reasons.push("chain_or_qsr");
  if (quickService) reasons.push("quick_service");
  if (!input.hasLocation) reasons.push("missing_location");
  if (categoryEvidence === "mismatch") reasons.push("category_mismatch");
  if (categoryEvidence === "missing") reasons.push("category_evidence_missing");

  const outing = calculateOutingFitScore(input);
  const ratingScore = clamp((input.rating - 4) * 38, 0, 38);
  const reviewScore = clamp(Math.log10(Math.max(1, input.reviewCount)) * 8 - 4, 0, 24);
  const completenessScore = (input.hasPhoto ? 7 : 0) + (input.hasWebsite ? 5 : 0) + (input.hasPhone ? 3 : 0) + (input.hasHours ? 4 : 0) + (input.hasLocation ? 5 : 0);
  const chainPenalty = chain.isChain ? 55 : 0;
  const quickServicePenalty = quickService ? 35 : 0;
  const score = Math.round(clamp(ratingScore + reviewScore + completenessScore + outing.score - chainPenalty - quickServicePenalty, 0, 100));

  const hardReject = reasons.some((reason) => ["missing_rating", "missing_reviews", "rating_below_floor", "reviews_below_floor", "chain_or_qsr", "missing_location", "category_mismatch"].includes(reason));
  if (hardReject) {
    return result({ decision: "reject", score, outingFitScore: outing.score, reasons: [...reasons, ...outing.reasons], chainBrand: chain.chainBrand, quickService, categoryEvidence, thresholds });
  }

  const completeForAuto = input.hasPhoto && input.hasWebsite && input.hasHours && input.hasLocation;
  const quickServiceAutoEligible = quickService && input.kind === "restaurant" && !hiddenGem && input.rating >= thresholds.autoMinRating && input.reviewCount >= thresholds.autoMinReviews && score >= 50 && completeForAuto;
  const outingAutoEligible = !quickService && !hiddenGem && categoryEvidence !== "missing" && input.rating >= thresholds.autoMinRating && input.reviewCount >= thresholds.autoMinReviews && score >= 72 && outing.score >= (input.kind === "activity" ? 18 : 8) && completeForAuto;

  if (quickServiceAutoEligible || outingAutoEligible) {
    reasons.push(quickService ? "quick_service_search_only" : "curated_auto_import");
    return result({ decision: "auto_import", score, outingFitScore: outing.score, reasons: [...reasons, ...outing.reasons], chainBrand: chain.chainBrand, quickService, categoryEvidence, thresholds });
  }

  const reviewEligible = input.rating >= thresholds.reviewMinRating && input.reviewCount >= thresholds.reviewMinReviews && score >= (quickService ? 40 : 55);
  if (reviewEligible) {
    if (!input.hasPhoto) reasons.push("needs_photo");
    if (!input.hasWebsite) reasons.push("needs_website");
    if (!input.hasHours) reasons.push("needs_hours");
    if (hiddenGem) reasons.push("subjective_hidden_gem_requires_review");
    if (quickService) reasons.push("quick_service_search_only");
    else if (input.kind === "restaurant" && outing.score < 8) reasons.push("weak_outing_evidence");
    reasons.push("curated_manual_review");
    return result({ decision: "review", score, outingFitScore: outing.score, reasons: [...reasons, ...outing.reasons], chainBrand: chain.chainBrand, quickService, categoryEvidence, thresholds });
  }

  reasons.push("quality_score_below_curated_threshold");
  return result({ decision: "reject", score, outingFitScore: outing.score, reasons: [...reasons, ...outing.reasons], chainBrand: chain.chainBrand, quickService, categoryEvidence, thresholds });
}
