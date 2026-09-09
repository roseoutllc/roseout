import { describe, expect, it } from "vitest";
import { deriveLocationQualityState } from "../location-quality-state";

const base = (overrides: Record<string, unknown> = {}) => ({
  status: "approved",
  quality_status: "publish_ready",
  data_status: "clean",
  source_quality_status: "enriched",
  import_confidence: "high",
  public_visibility_tier: "standard",
  duplicate_status: "unique",
  is_hidden: false,
  is_low_level: false,
  has_photos: true,
  main_image: "https://example.com/photo.jpg",
  images: ["https://example.com/photo.jpg"],
  address: "1 Main St",
  city: "New York",
  state: "NY",
  latitude: 40.7,
  longitude: -73.9,
  location_type: "restaurant",
  ...overrides,
});

describe("canonical location quality state", () => {
  it("returns ready for a publishable location", () => {
    expect(deriveLocationQualityState(base())).toBe("ready");
  });

  it("uses strict blocker precedence", () => {
    expect(deriveLocationQualityState(base({ status: "rejected", duplicate_status: "duplicate" }))).toBe("rejected");
    expect(deriveLocationQualityState(base({ duplicate_status: "possible_duplicate", is_hidden: true }))).toBe("duplicate_review");
    expect(deriveLocationQualityState(base({ is_hidden: true, main_image: null, images: [], has_photos: false }))).toBe("hidden");
    expect(deriveLocationQualityState(base({ main_image: null, images: [], has_photos: false }))).toBe("needs_photo");
    expect(deriveLocationQualityState(base({ quality_status: "needs_review", address: null }))).toBe("needs_enrichment");
  });

  it("treats out-of-market and low-level inventory as hidden", () => {
    expect(deriveLocationQualityState(base({ state: "CA" }))).toBe("hidden");
    expect(deriveLocationQualityState(base({ public_visibility_tier: "low_level" }))).toBe("hidden");
  });
});
