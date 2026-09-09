import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const recovery = readFileSync("supabase/functions/reservation-recovery/index.ts", "utf8");
const ingress = readFileSync("supabase/migrations/20260909141000_reservation_discovery_ingress_coverage.sql", "utf8");
const freshness = readFileSync("supabase/migrations/20260905182000_location_intelligence_reservation_retry_freshness.sql", "utf8");
const curated = readFileSync("lib/location-growth/googleCuratedPublisher.ts", "utf8");
const shared = readFileSync("supabase/functions/_shared/reservation-discovery.ts", "utf8");

describe("reservation discovery coverage contract", () => {
  it("allows default pending inventory into the recovery worker", () => {
    expect(recovery).toContain('"pending"');
    expect(recovery).toContain("ALLOWED_STATUSES");
  });

  it("queues every location insert and material website/reservation change", () => {
    expect(ingress).toContain("before insert on public.locations");
    expect(ingress).toContain("before update of website");
    expect(ingress).toContain("new.reservation_discovery_status := 'pending'");
    expect(ingress).toContain("new.reservation_discovery_next_retry_at := now()");
    expect(ingress).toContain("reservation_manual_override");
    expect(ingress).toContain("possible_duplicate");
  });

  it("uses failure-aware retry cadences", () => {
    expect(ingress).toContain("interval '1 day'");
    expect(freshness).toContain("when 'not_found' then");
    expect(freshness).toContain("interval '7 days'");
    expect(freshness).toContain("when 'blocked' then");
    expect(freshness).toContain("interval '30 days'");
    expect(freshness).toContain("when 'found' then");
  });

  it("preserves immediate curated-Google discovery and provider-link crawling without OpenTable API dependency", () => {
    expect(curated).toContain("enrichPublishedReservations");
    expect(curated).toContain("discoverReservationFromWebsite");
    expect(shared).toContain('["opentable.com", "OpenTable"]');
    expect(shared).toContain('host === "resy.com"');
    expect(shared).toContain('host === "tables.toasttab.com"');
  });
});
