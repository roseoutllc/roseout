import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const promotion = readFileSync("lib/location-growth/googleReviewPromotion.ts", "utf8");
const importRoute = readFileSync("app/api/admin/run-google-import/route.ts", "utf8");

describe("stored Google review promotion", () => {
  it("uses stored evidence only and does not call Google APIs", () => {
    expect(promotion).toContain('from("location_import_staging")');
    expect(promotion).toContain('.eq("quality_status", "review")');
    expect(promotion).toContain('.eq("duplicate_status", "unique")');
    expect(promotion).toContain('.eq("photo_status", "google_live_proxy")');
    expect(promotion).toContain('quality.decision !== "auto_import"');
    expect(promotion).toContain("googleApiCalls: 0");
    expect(promotion).not.toContain("getPlaceDetails");
    expect(promotion).not.toContain("searchPlaces");
    expect(promotion).not.toContain("getPlacePhotos");
    expect(promotion).not.toContain("fetchGooglePlacePhoto");
  });

  it("keeps current quality rules as the promotion authority", () => {
    expect(promotion).toContain("evaluateGoogleDiscoveryCandidate");
    expect(promotion).toContain('quality_status: "publish_ready"');
    expect(promotion).toContain('curation_tier: "curated"');
    expect(promotion).toContain('source_quality_status: "curated_google"');
    expect(promotion).toContain("publishReadyStagedLocations");
  });

  it("persists actionable reasons for rows retained in manual review", () => {
    expect(promotion).toContain("REVIEW_ATTENTION_REASONS");
    expect(promotion).toContain("reviewReasonFor(quality)");
    expect(promotion).toContain("rejection_reason: reviewReason");
    expect(promotion).toContain('source_quality_status: "curated_google_review"');
    expect(promotion).toContain("retainedReasonCounts");
    expect(promotion).toContain('"needs_website"');
    expect(promotion).toContain('"needs_hours"');
    expect(promotion).toContain('"weak_outing_evidence"');
  });

  it("runs recovery before new paid Google discovery", () => {
    const recovery = importRoute.indexOf("promoteStoredGoogleReviewCandidates");
    const discovery = importRoute.indexOf("await runGoogleCuratedDiscovery");
    expect(recovery).toBeGreaterThanOrEqual(0);
    expect(discovery).toBeGreaterThan(recovery);
    expect(importRoute).toContain("storedReviewGoogleApiCalls");
  });
});
