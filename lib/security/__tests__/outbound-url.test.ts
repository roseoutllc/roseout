import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { assertAllowedHttpsUrl, fetchAllowedHttpsUrl } from "../outbound-url";

const GOOGLE_HOSTS = ["maps.googleapis.com", ".googleusercontent.com"] as const;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("outbound URL hardening", () => {
  it("accepts an explicitly allowlisted HTTPS host", () => {
    expect(
      assertAllowedHttpsUrl("https://maps.googleapis.com/maps/api/place/photo", GOOGLE_HOSTS).hostname,
    ).toBe("maps.googleapis.com");
  });

  it.each([
    "http://maps.googleapis.com/maps/api/place/photo",
    "https://maps.googleapis.com.evil.example/photo",
    "https://127.0.0.1/photo",
    "https://[::1]/photo",
    "https://localhost/photo",
    "https://user:password@maps.googleapis.com/photo",
  ])("rejects unsafe outbound target %s", (url) => {
    expect(() => assertAllowedHttpsUrl(url, GOOGLE_HOSTS)).toThrow("Outbound URL is not allowed");
  });

  it("revalidates every redirect before following it", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://169.254.169.254/latest/meta-data" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchAllowedHttpsUrl("https://maps.googleapis.com/maps/api/place/photo", {
        allowedHosts: GOOGLE_HOSTS,
      }),
    ).rejects.toThrow("Outbound URL is not allowed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
