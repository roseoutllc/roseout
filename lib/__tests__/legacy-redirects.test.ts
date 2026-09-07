import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const redirectCases = [
  ["app/reserve/portal/page.tsx", "ROUTES.reserveDashboard"],
  ["app/reserve/portal/reservations/page.tsx", "ROUTES.reserveDashboardReservations"],
  ["app/dashboard/reservations/page.tsx", "ROUTES.adminReservations"],
  ["app/business/dashboard/reservations/page.tsx", "ROUTES.reserveDashboardReservations"],
  ["app/business/dashboard/notifications/page.tsx", "ROUTES.businessNotificationSettings"],
] as const;

describe("legacy route redirects", () => {
  it.each(redirectCases)("%s redirects through the route registry", (file, expected) => {
    const source = readFileSync(file, "utf8");
    expect(source).toContain("redirect(");
    expect(source).toContain(expected);
  });
});
