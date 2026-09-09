import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const intent = readFileSync("lib/reservations/sms-intent.ts", "utf8");
const late = readFileSync("lib/reservations/sms-late-arrival.ts", "utf8");
const entry = readFileSync("lib/reservations/sms-actions-entry.ts", "utf8");
const tsconfig = readFileSync("tsconfig.json", "utf8");

describe("reservation late-arrival SMS", () => {
  it("distinguishes lateness from a reschedule", () => {
    expect(intent).toContain('intent: "late_arrival"');
    expect(intent).toContain("A late-arrival report does not change the reservation time");
    expect(intent).toContain("move my reservation to 8:15");
  });

  it("records ETA/delay without updating reservation_time", () => {
    expect(late).toContain("late_arrival_reported_at");
    expect(late).toContain("late_arrival_minutes");
    expect(late).toContain("late_arrival_eta");
    const updateBlock = late.match(/\.update\(\{([\s\S]*?)\}\)\s*\.eq\("id", reservation\.id\)/)?.[1] || "";
    expect(updateBlock).not.toContain("reservation_time:");
    expect(late).toContain("Your reservation is still scheduled for");
  });

  it("routes late arrival before the legacy mutation state machine", () => {
    expect(entry.indexOf("processReservationLateArrival")).toBeLessThan(entry.indexOf("processCore(input)"));
    expect(tsconfig).toContain('"@/lib/reservations/sms-actions"');
    expect(tsconfig).toContain("sms-actions-entry.ts");
  });
});
