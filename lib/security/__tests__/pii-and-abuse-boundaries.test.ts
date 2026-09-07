import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (repoPath: string) => fs.readFileSync(path.join(process.cwd(), repoPath), "utf8");

describe("PII and abuse security boundaries", () => {
  it("never derives the current user from an unverified impersonation cookie or service role client", () => {
    const source = read("lib/getCurrentUserId.ts");
    expect(source).not.toContain("theouthaven_impersonate_user_id");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).toContain("@/lib/supabase-server");
    expect(source).toContain("auth.getUser()");
  });

  it("locks privileged SECURITY DEFINER RPCs to server-side callers", () => {
    const sql = read("supabase/migrations/20260907223000_lock_public_security_definer_rpcs.sql");
    for (const fn of [
      "enterprise_search_profile_locations",
      "enqueue_nightly_location_search_profile_run",
      "book_large_group_live",
      "track_location_analytics_event",
    ]) {
      expect(sql).toContain(fn);
    }
    expect(sql).toMatch(/from PUBLIC, anon, authenticated/);
    expect(sql).toMatch(/to service_role/);
  });

  it("keeps applicant resumes private and removes active SVG content from public media buckets", () => {
    const sql = read("supabase/migrations/20260907224500_harden_public_storage_mime_types.sql");
    expect(sql).toContain("career-resumes");
    expect(sql).toContain("public = false");
    expect(sql).toContain("email-assets");
    expect(sql).toContain("reservation-assets");
    expect(sql).toContain("user-avatars");
    expect(sql).not.toContain("image/svg+xml");
  });

  it("keeps representative PII domains behind their authorization guard", () => {
    const guarded: Array<[string, string[]]> = [
      ["app/api/events/ticket-orders/[orderId]/refund/route.ts", ["requireOwnerOrAdminAccess", "auth.getUser"]],
      ["app/api/experiences/check-in/route.ts", ["canManage", "auth.getUser"]],
      ["app/api/admin/crm/context/route.ts", ["requireAdminRole"]],
      ["app/api/admin/support-tickets/route.ts", ["requireAdminApiRole"]],
      ["app/api/admin/careers/applications/route.ts", ["requireAdminRole"]],
      ["app/api/admin/beta/testers/route.ts", ["requireBetaAdmin"]],
      ["app/api/admin/team/members/route.ts", ["requireAdminApiRole"]],
    ];

    for (const [file, markers] of guarded) {
      const source = read(file);
      for (const marker of markers) expect(source, `${file} missing ${marker}`).toContain(marker);
    }
  });

  it("does not disclose an existing event ticket bearer token by email", () => {
    const source = read("app/api/events/[id]/tickets/route.ts");
    expect(source).not.toContain("ticketUrl: `/tickets/${existing.data.public_token}`");
  });

  it("rate limits public routes that create cost, communications, uploads, or bookings", () => {
    const source = read("proxy.ts");
    for (const prefix of [
      "/api/auth",
      "/api/careers",
      "/api/launch/waitlist",
      "/api/public/large-group-bookings",
      "/api/experiences",
      "/api/events",
      "/api/support",
      "/api/user/support",
      "/api/search",
      "/api/generate",
      "/api/google/import",
      "/api/locations/optimize",
      "/api/image-proxy",
      "/api/reservations",
      "/api/reserve",
    ]) {
      expect(source, `missing distributed rate rule for ${prefix}`).toContain(`prefix: \"${prefix}\"`);
    }
    expect(source).toContain("await enforceRateLimit(");
  });
});
