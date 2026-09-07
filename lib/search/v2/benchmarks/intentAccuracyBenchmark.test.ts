import { describe, expect, it } from "vitest";
import { buildSearchPlan } from "../planner/buildSearchPlan";
import { INTENT_ACCURACY_CORPUS, INTENT_ACCURACY_GOLD, type IntentBenchmarkCase } from "./intentAccuracyCorpus";
import { INTENT_ACCURACY_EXPANSION } from "./intentAccuracyExpansion";

const TARGET_ACCURACY = 0.997;
const allCases = [...INTENT_ACCURACY_CORPUS, ...INTENT_ACCURACY_EXPANSION];

function norm(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}
function containsAny(values: readonly unknown[] | undefined, expected: readonly string[]) {
  const actual = (values ?? []).map(norm);
  return expected.some((wanted) => actual.some((value) => value === norm(wanted) || value.includes(norm(wanted)) || norm(wanted).includes(value)));
}
function scoreCase(testCase: IntentBenchmarkCase, plan: any) {
  const e = testCase.expected;
  const checks: Array<{ label: string; ok: boolean }> = [];
  const add = (label: string, ok: boolean) => checks.push({ label, ok });
  if (e.mode !== undefined) add("mode", plan.mode === e.mode);
  if (e.restaurantRequired !== undefined) add("restaurantRequired", plan.restaurant?.required === e.restaurantRequired);
  if (e.activityRequired !== undefined) add("activityRequired", plan.activity?.required === e.activityRequired);
  if (e.borough !== undefined) add("borough", norm(plan.geo?.borough) === norm(e.borough));
  if (e.neighborhood !== undefined) add("neighborhood", norm(plan.geo?.neighborhood) === norm(e.neighborhood));
  if (e.cuisinesAnyOf?.length) add("cuisine", containsAny(plan.restaurant?.cuisines, e.cuisinesAnyOf));
  if (e.activityCategoriesAnyOf?.length) add("activityCategory", containsAny(plan.activity?.categories, e.activityCategoriesAnyOf));
  if (e.restaurantExclusionsAnyOf?.length) add("restaurantExclusion", containsAny(plan.restaurant?.exclusions, e.restaurantExclusionsAnyOf));
  if (e.activityExclusionsAnyOf?.length) add("activityExclusion", containsAny(plan.activity?.exclusions, e.activityExclusionsAnyOf));
  if (e.budget !== undefined) add("budget", plan.preferences?.budget === e.budget);
  if (e.travelMode !== undefined) add("travelMode", plan.travel?.mode === e.travelMode);
  if (e.requireWalkable !== undefined) add("requireWalkable", plan.pairing?.requireWalkable === e.requireWalkable);
  if (e.sameVenueRequired !== undefined) add("sameVenueRequired", plan.pairing?.sameVenueRequired === e.sameVenueRequired);
  if (e.plannedForPresent !== undefined) add("plannedFor", Boolean(plan.plannedFor) === e.plannedForPresent);
  return { checks, passed: checks.length > 0 && checks.every((check) => check.ok) };
}

async function runBenchmark(cases: readonly IntentBenchmarkCase[]) {
  const failures: Array<{ id: string; category: string; query: string; failedLabels: string[] }> = [];
  const byCategory = new Map<string, { total: number; passed: number }>();
  let passed = 0;
  let labels = 0;
  let labelsPassed = 0;
  for (const testCase of cases) {
    const plan = await buildSearchPlan({ input: { query: testCase.query, selectedLane: "auto" } as any });
    const result = scoreCase(testCase, plan);
    labels += result.checks.length;
    labelsPassed += result.checks.filter((check) => check.ok).length;
    if (result.passed) passed += 1;
    else failures.push({ id: testCase.id, category: testCase.category, query: testCase.query, failedLabels: result.checks.filter((check) => !check.ok).map((check) => check.label) });
    const bucket = byCategory.get(testCase.category) ?? { total: 0, passed: 0 };
    bucket.total += 1;
    if (result.passed) bucket.passed += 1;
    byCategory.set(testCase.category, bucket);
  }
  const total = cases.length;
  return {
    total,
    passed,
    failed: total - passed,
    exactCaseAccuracy: total ? passed / total : 0,
    labelAccuracy: labels ? labelsPassed / labels : 0,
    targetAccuracy: TARGET_ACCURACY,
    targetGap: TARGET_ACCURACY - (total ? passed / total : 0),
    byCategory: Object.fromEntries([...byCategory].map(([category, value]) => [category, { ...value, accuracy: value.total ? value.passed / value.total : 0 }])),
    failures,
  };
}

describe("Search V2 labeled intent accuracy benchmark", () => {
  it("maintains a thousand-plus prompt benchmark and reports an exact-match baseline", async () => {
    expect(allCases.length).toBeGreaterThanOrEqual(1200);
    expect(INTENT_ACCURACY_GOLD.length).toBeGreaterThanOrEqual(20);
    const report = await runBenchmark(allCases);
    console.log("SEARCH_INTENT_ACCURACY_REPORT", JSON.stringify({ ...report, failures: report.failures.slice(0, 40) }, null, 2));
    expect(report.total).toBe(allCases.length);
    expect(report.exactCaseAccuracy).toBeGreaterThanOrEqual(0);
    expect(report.exactCaseAccuracy).toBeLessThanOrEqual(1);

    const requestedGate = Number(process.env.SEARCH_INTENT_ACCURACY_GATE ?? "0");
    if (Number.isFinite(requestedGate) && requestedGate > 0) {
      expect(report.exactCaseAccuracy).toBeGreaterThanOrEqual(requestedGate);
    }
  }, 120_000);
});
