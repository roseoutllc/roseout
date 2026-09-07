import { afterEach, describe, expect, it } from "vitest";
import { configuredRerankTimeoutMs } from "../scoring/applyHfReranking";

const original = process.env.SEARCH_HF_RERANK_REQUEST_TIMEOUT_MS;

afterEach(() => {
  if (original == null) delete process.env.SEARCH_HF_RERANK_REQUEST_TIMEOUT_MS;
  else process.env.SEARCH_HF_RERANK_REQUEST_TIMEOUT_MS = original;
});

describe("HF rerank latency budget", () => {
  it("uses an 1100ms default", () => {
    delete process.env.SEARCH_HF_RERANK_REQUEST_TIMEOUT_MS;
    expect(configuredRerankTimeoutMs()).toBe(1100);
  });

  it("caps stale production configuration at 1200ms", () => {
    process.env.SEARCH_HF_RERANK_REQUEST_TIMEOUT_MS = "5000";
    expect(configuredRerankTimeoutMs()).toBe(1200);
  });

  it("keeps the timeout high enough to avoid immediate false failures", () => {
    process.env.SEARCH_HF_RERANK_REQUEST_TIMEOUT_MS = "50";
    expect(configuredRerankTimeoutMs()).toBe(400);
  });
});
