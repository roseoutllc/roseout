import fs from "node:fs";

const files = [
  "app/api/admin/location-growth/enrich-high-value/route.ts",
  "app/api/admin/location-growth/migrate-enriched-photos/route.ts",
  "app/api/admin/location-growth/repair-import-photo-failures/route.ts",
  "app/api/admin/location-tools/search-profiles/[locationId]/review/route.ts",
  "app/api/admin/location-tools/search-profiles/runs/route.ts",
  "app/api/admin/locations/[locationId]/photos/upload/route.ts",
  "app/api/admin/locations/[locationId]/repair-publishability/route.ts",
  "app/api/admin/locations/[locationId]/summary/route.ts",
  "app/api/admin/locations/backfill-search-document/route.ts",
  "app/api/admin/locations/enrichment-runs/route.ts",
  "app/api/admin/locations/google-enrichment/single/route.ts",
  "app/api/admin/locations/google-food-suggestions/apply/route.ts",
  "app/api/admin/locations/repair-publishability/route.ts",
  "app/api/admin/restaurants/route.ts",
  "app/api/admin/restaurants/[id]/route.ts",
];

const source = Object.fromEntries(files.map((file) => [file, fs.readFileSync(file, "utf8")]));
const cluster = Object.values(source).join("\n");
const projections = fs.readFileSync("lib/admin/location-data-projections.ts", "utf8");
const restaurantDetail = source["app/api/admin/restaurants/[id]/route.ts"];
const photoUpload = source["app/api/admin/locations/[locationId]/photos/upload/route.ts"];
const foodApply = source["app/api/admin/locations/google-food-suggestions/apply/route.ts"];
const enrichmentRuns = source["app/api/admin/locations/enrichment-runs/route.ts"];
const profileRuns = source["app/api/admin/location-tools/search-profiles/runs/route.ts"];

const enrichmentProjection = projections.match(/ADMIN_LOCATION_ENRICHMENT_FIELDS = `([\s\S]*?)`;/)?.[1] || "";
const restaurantProjection = projections.match(/RESTAURANT_ADMIN_FIELDS = `([\s\S]*?)`;/)?.[1] || "";
const enrichmentRunProjection = projections.match(/LOCATION_ENRICHMENT_RUN_FIELDS = `([\s\S]*?)`;/)?.[1] || "";
const profileRunProjection = projections.match(/LOCATION_SEARCH_PROFILE_RUN_FIELDS = `([\s\S]*?)`;/)?.[1] || "";
const foodProjection = projections.match(/GOOGLE_FOOD_SUGGESTION_FIELDS = `([\s\S]*?)`;/)?.[1] || "";
const fields = (value) => value.split(",").map((field) => field.trim()).filter(Boolean);

const checks = {
  clusterAvoidsBroadSelect: !/\.select\(\s*["'`]\*["'`](?:\s*,|\s*\))/.test(cluster),
  locationProjectionExcludesSensitiveAccountData: !fields(enrichmentProjection).some((field) => ["owner_email","owner_phone","claimed_by_email","claim_token","stripe_customer_id","stripe_subscription_id","metadata","embedding","semantic_embedding"].includes(field)),
  restaurantProjectionExcludesOwnerAndClaimSecrets: !fields(restaurantProjection).some((field) => ["owner_email","owner_phone","claimed_by_email","claim_token","owner_signup_token","owner_signup_url","embedding"].includes(field)),
  restaurantPatchIsAllowlisted: /STRING_FIELDS/.test(restaurantDetail) && /buildPatch/.test(restaurantDetail) && !/\.update\(\s*body\s*\)/.test(restaurantDetail),
  photoUploadUsesCurrentLogSchema: /source:\s*"location_photo_uploaded"/.test(photoUpload) && /actor_id:/.test(photoUpload) && !/actor_user_id:|action:\s*"location_photo_uploaded"/.test(photoUpload),
  foodSuggestionsExcludeEvidence: !fields(foodProjection).includes("evidence") && /select\("id",\s*\{\s*count:\s*"exact"/.test(foodApply),
  enrichmentRunResponseExcludesInternalSnapshots: !fields(enrichmentRunProjection).some((field) => ["settings","before_quality","after_quality","last_batch","last_error"].includes(field)),
  profileRunResponseExcludesMetadata: !fields(profileRunProjection).includes("metadata"),
  searchProfileReviewUsesNamedProjection: /LOCATION_SEARCH_PROFILE_FIELDS/.test(source["app/api/admin/location-tools/search-profiles/[locationId]/review/route.ts"]),
  backfillUsesSearchDocumentProjection: /ADMIN_LOCATION_SEARCH_DOCUMENT_FIELDS/.test(source["app/api/admin/locations/backfill-search-document/route.ts"]),
  googleSingleNoCandidatePayloadEcho: !/candidates:\s*searchPayload\.places/.test(source["app/api/admin/locations/google-enrichment/single/route.ts"]),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ routes: files.length, checks, failed }, null, 2));
if (failed.length) process.exit(1);
