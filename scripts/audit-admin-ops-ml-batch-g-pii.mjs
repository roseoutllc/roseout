import fs from "node:fs";

const files = {
  reservationBackfill: "app/api/admin/backfill-reservation-links/route.ts",
  cleanupLocations: "app/api/admin/cleanup-locations/route.ts",
  locationScores: "app/api/admin/ml/recalculate-location-scores/route.ts",
  phase2: "app/api/admin/ml/recalculate-phase2/route.ts",
  reviewIntelligence: "app/api/admin/ml/recalculate-review-intelligence/route.ts",
  finishLine: "app/api/admin/production-finish-line/route.ts",
  runGate: "app/api/admin/production-finish-line/run-gate/route.ts",
  googleMetadata: "app/api/admin/restaurants/enrich-google-metadata/route.ts",
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, fs.readFileSync(path, "utf8")]),
);
const cluster = Object.values(source).join("\n");

const checks = {
  clusterAvoidsBroadSelect:
    !cluster.includes('.select("*")') && !cluster.includes(".select('*')"),
  cleanupUsesNamedLocationProjection:
    source.cleanupLocations.includes("ADMIN_LOCATION_ENRICHMENT_FIELDS") &&
    source.cleanupLocations.includes(".select(ADMIN_LOCATION_ENRICHMENT_FIELDS)"),
  reviewIntelligenceUsesNamedProjection:
    source.reviewIntelligence.includes("REVIEW_SIGNAL_FIELDS") &&
    source.reviewIntelligence.includes(".select(REVIEW_SIGNAL_FIELDS)"),
  reviewIntelligenceProjectionIsTyped:
    source.reviewIntelligence.includes("type ReviewSignalRow") &&
    source.reviewIntelligence.includes("as unknown as ReviewSignalRow[]"),
  reviewIntelligenceInputsAreBounded:
    source.reviewIntelligence.includes("body.locationId.length <= 80") &&
    source.reviewIntelligence.includes("Math.min(3650"),
  locationScoresUseNamedEventInputs:
    source.locationScores.includes("ANALYTICS_FIELDS") &&
    source.locationScores.includes("OUTING_FIELDS") &&
    source.locationScores.includes("REVIEW_FEATURE_FIELDS"),
  locationScoresBoundReviewSummary:
    source.locationScores.includes("review_summary.slice(0,500)"),
  phase2UsesNamedInputProjections:
    source.phase2.includes("SEARCH_EVENT_FIELDS") &&
    source.phase2.includes("ANALYTICS_EVENT_FIELDS") &&
    source.phase2.includes("OUTING_FIELDS") &&
    source.phase2.includes("REVIEW_FEATURE_FIELDS"),
  phase2ReturnsMinimalScoreSamples:
    source.phase2.includes("restaurant_location_id: row.restaurant_location_id") &&
    source.phase2.includes("intent_score: row.intent_score") &&
    !source.phase2.includes(".slice(0, 5),\n    sampleTopPairScores"),
  finishLineUsesNamedCollections:
    source.finishLine.includes("ITEM_FIELDS") &&
    source.finishLine.includes("ACCESS_FIELDS") &&
    source.finishLine.includes("QR_FIELDS") &&
    source.finishLine.includes("COMMAND_FIELDS") &&
    source.finishLine.includes("PROMPT_FIELDS"),
  finishLineMutationIsAllowlistedAndBounded:
    source.finishLine.includes("allowedFields") &&
    source.finishLine.includes("boundedTextFields") &&
    source.finishLine.includes(".select(collection.fields)"),
  runGateUsesNamedProjection:
    source.runGate.includes("GATE_FIELDS") &&
    source.runGate.includes(".select(GATE_FIELDS)"),
  reservationBackfillUsesPerTableFields:
    source.reservationBackfill.includes("BACKFILL_FIELDS") &&
    source.reservationBackfill.includes(".select(BACKFILL_FIELDS[table])"),
  reservationBackfillHidesAuthDebug:
    !source.reservationBackfill.includes("authDebug") &&
    !source.reservationBackfill.includes("hasAdminSecretEnv"),
  reservationBackfillBoundsFailureSurface:
    source.reservationBackfill.includes("slice(0, 500)") &&
    source.reservationBackfill.includes("tableResult.failures.slice(0, 20 - result.failures.length)"),
  googleMetadataMutationUsesCanonicalProjection:
    source.googleMetadata.includes("RESTAURANT_LOCATION_SELECT") &&
    source.googleMetadata.includes(".select(RESTAURANT_LOCATION_SELECT)"),
  googleMetadataBoundsErrors:
    source.googleMetadata.includes("function boundedError") &&
    source.googleMetadata.includes("slice(0, 500)"),
};

const failed = Object.entries(checks)
  .filter(([, ok]) => !ok)
  .map(([name]) => name);

console.log(
  JSON.stringify(
    { routes: Object.keys(files).length, checks, failed },
    null,
    2,
  ),
);
if (failed.length) process.exit(1);
