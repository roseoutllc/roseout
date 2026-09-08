import fs from "node:fs";

const files = {
  benchmarkRun: "app/api/admin/search-benchmark/run/route.ts",
  healthDetail: "app/api/admin/search-health/[id]/route.ts",
  qualityBenchmark: "app/api/admin/search-quality/benchmark/route.ts",
  guardrails: "app/api/admin/search-ranking-guardrails/route.ts",
  rollout: "app/api/admin/search-ranking-rollout/route.ts",
  rolloutRun: "app/api/admin/search-ranking-rollout/run/route.ts",
  shadowReviews: "app/api/admin/search-ranking-shadow-reviews/route.ts",
  semanticNightly: "app/api/admin/semantic-nightly/route.ts",
};

const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, fs.readFileSync(path, "utf8")]));
const cluster = Object.values(source).join("\n");
const checks = {
  clusterAvoidsBroadSelect: !cluster.includes('.select("*")') && !cluster.includes(".select('*')"),
  benchmarkScorecardUsesNamedProjection: source.benchmarkRun.includes("SCORECARD_FIELDS") && source.benchmarkRun.includes(".select(SCORECARD_FIELDS)"),
  healthDetailUsesNamedProjection: source.healthDetail.includes("SEARCH_HEALTH_DETAIL_FIELDS") && source.healthDetail.includes(".select(SEARCH_HEALTH_DETAIL_FIELDS)"),
  healthDebugIsAllowlisted: source.healthDetail.includes("function safeDebug") && source.healthDetail.includes("const allowed ="),
  healthReviewNotesAreBounded: source.healthDetail.includes("slice(0, 2000)"),
  qualityBenchmarkUsesNamedCases: source.qualityBenchmark.includes("BENCHMARK_CASE_FIELDS") && source.qualityBenchmark.includes(".select(BENCHMARK_CASE_FIELDS)"),
  qualityBenchmarkDoesNotPersistRawResponse: source.qualityBenchmark.includes("response: benchmarkEvidence(response)") && !source.qualityBenchmark.includes("latency_ms: performance.now() - started, response }") ,
  guardrailsUseNamedProjections: source.guardrails.includes("SETTINGS_FIELDS") && source.guardrails.includes("HEALTH_FIELDS") && source.guardrails.includes("EVENT_FIELDS"),
  rolloutReasonIsBounded: source.rollout.includes("slice(0, 1000)"),
  rolloutValidatesEnabledTargetStage: source.rollout.includes('.from("search_ranking_rollout_stages")') && source.rollout.includes('.eq("enabled", true)'),
  rolloutRunHidesSnapshotsAndActors: source.rolloutRun.includes("RUN_FIELDS") && !source.rolloutRun.includes('select("*")') && !source.rolloutRun.includes("baseline_snapshot,final_snapshot"),
  rolloutRunReasonIsBounded: source.rolloutRun.includes("bounded(body.reason, 1000)"),
  shadowReviewExcludesExperimentMetadata: source.shadowReviews.includes("EXPERIMENT_FIELDS") && !source.shadowReviews.includes('metadata,created_at,search_ranking_experiment_reviews'),
  shadowReviewMutationUsesNamedProjection: source.shadowReviews.includes("REVIEW_FIELDS") && source.shadowReviews.includes(".select(REVIEW_FIELDS)"),
  semanticNightlyUsesNamedLocationProjection: source.semanticNightly.includes("LOCATION_SEMANTIC_FIELDS") && source.semanticNightly.includes(".select(LOCATION_SEMANTIC_FIELDS"),
  semanticNightlyUsesNamedAnalyticsProjection: source.semanticNightly.includes("ANALYTICS_FIELDS") && source.semanticNightly.includes(".select(ANALYTICS_FIELDS)"),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ routes: Object.keys(files).length, checks, failed }, null, 2));
if (failed.length) process.exit(1);
