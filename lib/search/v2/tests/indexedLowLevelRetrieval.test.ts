import { describe, expect, it } from "vitest";
import {
  boundingBoxForLowLevelScope,
  indexedLowLevelSearchTerms,
  indexedLowLevelServiceTypes,
} from "../retrieval/retrieveIndexedLowLevelLocations";

function request(overrides: Record<string, unknown> = {}): any {
  return {
    desiredRole: "restaurant",
    retrievalTerms: ["deli", "quick bite"],
    cuisines: [],
    foods: ["quick bite"],
    categories: [],
    features: [],
    eligibleStorageTypes: ["restaurant"],
    allowLowLevel: true,
    geo: {
      source: "current_location",
      market: "NYC_LONG_ISLAND",
      city: "New York",
      borough: null,
      neighborhood: null,
      county: null,
      state: "NY",
      latitude: 40.758,
      longitude: -73.9855,
      radiusMiles: 6,
      strictness: "preferred",
    },
    ...overrides,
  };
}

describe("indexed explicit low-level retrieval", () => {
  it("keeps concrete deli evidence but excludes generic quick-bite control language", () => {
    expect(indexedLowLevelSearchTerms(request())).toEqual(["deli"]);
  });

  it("uses indexed Google service types for generic quick-bite and fast-casual intent", () => {
    const types = indexedLowLevelServiceTypes(request({ retrievalTerms: ["fast casual"], foods: [] }));
    expect(types).toEqual(expect.arrayContaining(["meal_takeaway", "fast_food_restaurant", "sandwich_shop", "deli"]));
  });

  it("does not widen ordinary destination dining into low-level service types", () => {
    const types = indexedLowLevelServiceTypes(request({ retrievalTerms: ["italian"], foods: [], allowLowLevel: false }));
    expect(types).toEqual([]);
  });

  it("builds a bounded coordinate scout around the requested radius", () => {
    const box = boundingBoxForLowLevelScope(request().geo);
    expect(box).not.toBeNull();
    expect(box!.minLat).toBeLessThan(40.758);
    expect(box!.maxLat).toBeGreaterThan(40.758);
    expect(box!.minLng).toBeLessThan(-73.9855);
    expect(box!.maxLng).toBeGreaterThan(-73.9855);
  });

  it("does not invent a bounding box when coordinates are incomplete", () => {
    expect(boundingBoxForLowLevelScope({ ...request().geo, latitude: null })).toBeNull();
  });
});
