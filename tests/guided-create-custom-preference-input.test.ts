import { describe, expect, it } from "vitest";

const COMMIT_KEYS = new Set(["Enter", ","]);

function shouldCommitPreference(key: string, value: string) {
  return COMMIT_KEYS.has(key) && value.trim().length > 0;
}

describe("guided create custom preference input", () => {
  it("keeps spaces inside multi-word preferences", () => {
    expect(shouldCommitPreference(" ", "live")).toBe(false);
    expect(shouldCommitPreference("Enter", "live music")).toBe(true);
  });

  it("still supports comma and enter submission", () => {
    expect(shouldCommitPreference(",", "outdoor seating")).toBe(true);
    expect(shouldCommitPreference("Enter", "quiet table")).toBe(true);
  });
});
