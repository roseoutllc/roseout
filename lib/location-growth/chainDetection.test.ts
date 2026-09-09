import { describe, expect, it } from "vitest";
import { detectChainBrand } from "@/lib/location-growth/chainDetection";

describe("location growth chain detection", () => {
  it("recognizes bb.q Chicken punctuation and location suffixes", () => {
    const detected = detectChainBrand("bb.q Chicken H-Mart Paramus");
    expect(detected.isChain).toBe(true);
    expect(detected.chainBrand).toBe("bbq chicken");
  });

  it("does not turn an unrelated barbecue restaurant into the chain", () => {
    expect(detectChainBrand("Bitterman's BBQ").isChain).toBe(false);
  });
});
