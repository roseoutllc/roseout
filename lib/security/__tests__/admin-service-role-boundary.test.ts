import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { requiresAdminApiSession } from "../admin-api-boundary-paths";

const ROUTE_AUTH_MARKERS = [
  "requireAdminApiRole(", "requireSuperAdmin(", "requireAdminRole(", "getCurrentAdmin(",
  "CRON_SECRET", "x-internal-import-secret", "x-admin-secret", "authorizeAdminApiBoundary(",
];

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function routePath(file: string) {
  const rel = path.relative(path.join(process.cwd(), "app"), file).replaceAll(path.sep, "/");
  return `/${rel}`.replace(/\/route\.ts$/, "").replace(/\[\.\.\.[^\]]+\]/g, "test/test").replace(/\[[^\]]+\]/g, "test-id");
}

describe("admin service-role boundary", () => {
  it("requires every service-role admin route to have route auth or the central session boundary", () => {
    const root = path.join(process.cwd(), "app", "api", "admin");
    const failures: string[] = [];
    for (const file of walk(root).filter((value) => value.endsWith("/route.ts"))) {
      const source = fs.readFileSync(file, "utf8");
      if (!source.includes("supabaseAdmin")) continue;
      const hasOwnAuth = ROUTE_AUTH_MARKERS.some((marker) => source.includes(marker));
      if (!hasOwnAuth && !requiresAdminApiSession(routePath(file))) failures.push(path.relative(process.cwd(), file));
    }
    expect(failures, `unguarded service-role admin routes: ${failures.join(", ")}`).toEqual([]);
  });
});
