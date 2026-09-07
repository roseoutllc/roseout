import { describe, expect, it } from "vitest";
import { planPairRecovery } from "../recoveryPolicy";

describe("pair recovery distance policy", () => {
  it("widens only unconstrained mixed-outing recovery", () => {
    const plan = planPairRecovery({
      restaurantCount: 15,
      activityCount: 8,
      pairCount: 0,
      radiusMiles: 0,
      maxPairDistanceMiles: null,
    });

    expect(plan.shouldRecover).toBe(true);
    expect(plan.lane).toBe("restaurant");
    expect(plan.centerOn).toBe("activity");
    expect(plan.radiusMiles).toBeGreaterThanOrEqual(12);
    expect(plan.maxPairDistanceMiles).toBe(6);
  });

  it("never widens an explicit user pair-distance limit", () => {
    const plan = planPairRecovery({
      restaurantCount: 15,
      activityCount: 8,
      pairCount: 0,
      maxPairDistanceMiles: 1.25,
    });

    expect(plan.shouldRecover).toBe(true);
    expect(plan.maxPairDistanceMiles).toBe(1.25);
  });

  it("does not recover when a valid pair already exists", () => {
    const plan = planPairRecovery({
      restaurantCount: 15,
      activityCount: 8,
      pairCount: 1,
      maxPairDistanceMiles: null,
    });

    expect(plan.shouldRecover).toBe(false);
  });
});
