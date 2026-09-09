import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const cronRoute = readFileSync("app/api/cron/location-discovery/route.ts", "utf8");
const promotion = readFileSync("lib/location-growth/googleReviewPromotion.ts", "utf8");

function indexOfOrFail(source: string, needle: string) {
  const index = source.indexOf(needle);
  expect(index, `Expected source to contain: ${needle}`).toBeGreaterThanOrEqual(0);
  return index;
}

describe("scheduled Google review recovery", () => {
  it("recovers stored review candidates before paid discovery", () => {
    const recovery = indexOfOrFail(cronRoute, "await promoteStoredGoogleReviewCandidates({");
    const discovery = indexOfOrFail(cronRoute, "await runGoogleCuratedDiscovery({");

    expect(recovery).toBeLessThan(discovery);
    expect(cronRoute).toContain("locationType: kind");
  });

  it("surfaces zero-call recovery accounting", () => {
    expect(promotion).toContain("googleApiCalls: 0");
    expect(cronRoute).toContain("storedReviewGoogleApiCalls: storedReviewRecovery?.googleApiCalls || 0");
  });

  it("keeps recovery limited to staged unique review inventory", () => {
    expect(promotion).toContain('.eq("import_status", "staged")');
    expect(promotion).toContain('.eq("duplicate_status", "unique")');
    expect(promotion).toContain('.eq("quality_status", "review")');
    expect(promotion).toContain('.eq("photo_status", "google_live_proxy")');
  });
});
