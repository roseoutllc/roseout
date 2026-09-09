import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const discovery = readFileSync("lib/location-growth/googleCuratedDiscovery.ts", "utf8");
const publisher = readFileSync("lib/location-growth/googleCuratedPublisher.ts", "utf8");

function indexOfOrFail(source: string, needle: string) {
  const index = source.indexOf(needle);
  expect(index, `Expected source to contain: ${needle}`).toBeGreaterThanOrEqual(0);
  return index;
}

describe("curated Google import guardrails", () => {
  it("never treats Google photo attribution as a publish blocker for new candidates", () => {
    expect(discovery).toContain("Attribution is presentation metadata, not a photo-availability blocker.");
    expect(discovery).toContain("const hasPhoto = hasGooglePhoto;");
    expect(discovery).toContain('photo_status: hasGooglePhoto ? "google_live_proxy" : "missing_photo"');
    expect(discovery).not.toContain('photo_status: photoRequiresAttribution ? "requires_attribution_review"');
    expect(discovery).not.toContain('rejectionReasons.push("google_photo_requires_attribution")');
  });

  it("checks candidate memory and live duplicates before paid rich Place Details", () => {
    const memoryLookup = indexOfOrFail(discovery, "const memory = await readCandidateMemory(memoryKey);");
    const duplicateLookup = indexOfOrFail(discovery, "const duplicate = await findLiveDuplicate(placeId);");
    const richDetails = indexOfOrFail(discovery, "const details = await getPlaceDetailsLegacyCompat(placeId, {");

    expect(memoryLookup).toBeLessThan(richDetails);
    expect(duplicateLookup).toBeLessThan(richDetails);
    expect(discovery).toContain("counts.paidDetailsAvoided += 1;");
  });

  it("keeps compatibility recovery for legacy attribution rows", () => {
    expect(publisher).toContain('candidate.photo_status !== "requires_attribution_review"');
    expect(publisher).toContain('hasPhoto: true');
    expect(publisher).toContain('removeReason(candidate.rejection_reason, "google_photo_requires_attribution")');
  });
});
