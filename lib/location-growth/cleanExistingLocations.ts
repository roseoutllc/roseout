import { inferNycAddressArea } from "@/lib/nyc-address-inference";
import { detectChainBrand } from "@/lib/location-growth/chainDetection";
import {
  hasLocationPhoto,
  getPhotoStatus,
} from "@/lib/location-growth/photoDetection";
import {
  cleanText,
  normalizePhone,
  nullIfEmpty,
  removeDuplicatedCityStateZipFromAddress,
} from "@/lib/location-growth/shared";
import {
  calculateLocationQuality as weightedCalculateLocationQuality,
  qualitySearchAdjustment,
  qualityTierForScore,
} from "@/lib/location-quality-score";

export function cleanLocationRow(row: any) {
  const name =
    nullIfEmpty(row.name) ||
    nullIfEmpty(row.restaurant_name) ||
    nullIfEmpty(row.activity_name);
  const address = removeDuplicatedCityStateZipFromAddress(row);
  const primaryCategory =
    nullIfEmpty(row.primary_category) ||
    nullIfEmpty(row.cuisine) ||
    nullIfEmpty(row.cuisine_type) ||
    nullIfEmpty(row.activity_type) ||
    nullIfEmpty(row.primary_tag);
  const inferredArea = inferNycAddressArea({
    address,
    formatted_address: row.formatted_address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    zip_code: row.zip_code,
    postal_code: row.postal_code,
    borough: row.borough,
    neighborhood: row.neighborhood,
  });
  const nextMarket =
    inferredArea.market === "NYC_CORE"
      ? "NYC_CORE"
      : row.market || null;

  return {
    ...row,
    name,
    address,
    borough: row.borough || inferredArea.borough,
    neighborhood: row.neighborhood || inferredArea.neighborhood,
    market: nextMarket,
    phone: normalizePhone(row.phone) || nullIfEmpty(row.phone),
    primary_category: primaryCategory,
  };
}

export function calculateLocationQuality(row: any) {
  return weightedCalculateLocationQuality(row);
}

export function buildLocationCleanupUpdates(row: any) {
  const cleaned = cleanLocationRow(row);
  const qualityScore = calculateLocationQuality(cleaned);
  const qualityTier = qualityTierForScore(qualityScore);
  const hasPhotos = hasLocationPhoto(cleaned);
  const photoStatus = getPhotoStatus(cleaned);
  const chain = detectChainBrand(
    String(
      cleaned.name || cleaned.restaurant_name || cleaned.activity_name || "",
    ),
  );
  const qualityStatus =
    !hasPhotos
      ? "needs_photo"
      : qualityScore >= 50
        ? "publish_ready"
        : "review";
  const hasAddress = Boolean(cleanText(cleaned.address));
  const hasCoordinates = cleaned.latitude != null && cleaned.longitude != null;
  const hasCategory = Boolean(cleanText(cleaned.primary_category));
  const isDuplicate = cleaned.duplicate_status === "duplicate";
  const standardVisibility = !cleaned.is_hidden && !cleaned.is_low_level && !["hidden", "low_level", "internal", "pending_review", "rejected"].includes(String(cleaned.public_visibility_tier || "standard").toLowerCase());
  const trustedSource = !["imported_unverified", "low_level_review", "needs_enrichment"].includes(String(cleaned.source_quality_status || "").toLowerCase());
  const acceptableConfidence = String(cleaned.import_confidence || "").toLowerCase() !== "low";
  const isSearchable =
    qualityScore >= 50 &&
    hasPhotos &&
    hasAddress &&
    hasCoordinates &&
    hasCategory &&
    !isDuplicate &&
    standardVisibility &&
    trustedSource &&
    acceptableConfidence;

  const existingBoost = Number(cleaned.search_boost ?? 0);
  const qualityAdjustment = qualitySearchAdjustment(qualityScore);
  const chainAdjustment = chain.isChain ? -25 : 0;

  return {
    name: cleaned.name,
    address: cleaned.address,
    borough: cleaned.borough,
    neighborhood: cleaned.neighborhood,
    market: cleaned.market,
    phone: cleaned.phone,
    primary_category: cleaned.primary_category,
    normalized_name: cleanText(cleaned.name).toLowerCase() || null,
    normalized_address: cleanText(cleaned.address).toLowerCase() || null,
    normalized_phone: normalizePhone(cleaned.phone),
    quality_score: qualityScore,
    quality_status: qualityStatus,
    ranking_badge: qualityTier,
    is_searchable: isSearchable,
    has_photos: hasPhotos,
    photo_status: photoStatus,
    is_chain: chain.isChain,
    brand_type: chain.isChain ? "chain" : "independent",
    chain_brand: chain.chainBrand,
    curation_tier: chain.isChain
      ? "utility"
      : cleaned.curation_tier || "standard",
    date_score: chain.isChain ? 20 : (cleaned.date_score ?? 50),
    search_boost: existingBoost + qualityAdjustment + chainAdjustment,
    ...(chain.isChain ? { is_featured: false } : {}),
    data_status: isSearchable ? "clean" : "needs_review",
    last_cleaned_at: new Date().toISOString(),
    last_quality_check_at: new Date().toISOString(),
    last_ranked_at: new Date().toISOString(),
  };
}
