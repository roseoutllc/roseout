import { describe, expect, it, vi } from "vitest";
import { buildRetrievalRequests } from "../retrieval/buildRetrievalRequests";
import { retrieveUnifiedLocations } from "../retrieval/retrieveUnifiedLocations";

const geo = {
  source: "current_location",
  market: "NYC",
  city: "New York",
  borough: null,
  neighborhood: null,
  county: null,
  state: "NY",
  latitude: 40.758,
  longitude: -73.9855,
  radiusMiles: 6,
  strictness: "preferred",
};

function plan(rawQuery: string) {
  return {
    rawQuery,
    occasion: null,
    restaurant: { required: true, cuisines: [], foods: [], features: [], mealPeriods: [] },
    activity: { required: false, categories: [], features: [] },
    geo,
  } as any;
}

describe("explicit low-level restaurant retrieval", () => {
  it.each([
    "Find me a quick bite at a deli near me",
    "I want takeout nearby",
    "Find fast casual food near me",
    "Show me a food truck",
  ])("marks explicit quick-service intent for %s", (query) => {
    const restaurant = buildRetrievalRequests(plan(query)).find((request) => request.desiredRole === "restaurant");
    expect(restaurant?.allowLowLevel).toBe(true);
  });

  it("does not widen ordinary casual dinner into low-level inventory", () => {
    const restaurant = buildRetrievalRequests(plan("Find a casual restaurant for dinner near me")).find((request) => request.desiredRole === "restaurant");
    expect(restaurant?.allowLowLevel).toBe(false);
  });

  it("passes low-level permission to the deployed RPC and caps the candidate pool", async () => {
    const request = buildRetrievalRequests(plan("Find me a quick bite at a deli near me")).find((item) => item.desiredRole === "restaurant")!;
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    await retrieveUnifiedLocations({ rpc } as never, request, 60);
    expect(rpc).toHaveBeenCalledTimes(1);
    const [, params] = rpc.mock.calls[0];
    expect(params.p_allow_low_level).toBe(true);
    expect(params.p_limit).toBe(30);
  });

  it("keeps normal destination retrieval low-level permission disabled", async () => {
    const request = buildRetrievalRequests(plan("Find a nice restaurant for dinner near me")).find((item) => item.desiredRole === "restaurant")!;
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    await retrieveUnifiedLocations({ rpc } as never, request, 60);
    const [, params] = rpc.mock.calls[0];
    expect(params.p_allow_low_level).toBe(false);
    expect(params.p_limit).toBe(60);
  });
});
