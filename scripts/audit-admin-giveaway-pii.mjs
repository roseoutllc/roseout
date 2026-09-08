import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const broadSelect = /\.select\(\s*["'`]\*["'`]\s*\)/;

const files = {
  entries: "app/api/admin/giveaway/entries/route.ts",
  entryDetail: "app/api/admin/giveaway/entries/[id]/route.ts",
  bulk: "app/api/admin/giveaway/bulk/route.ts",
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, read(file)]),
);

const sensitiveFields = [
  "email_verification_token_hash",
  "consent_ip_address",
  "consent_user_agent",
  "ip_address",
  "user_agent",
  "metadata",
  "marketing_consent_text",
  "sms_consent_text",
  "email_consent_text",
];

const checks = {
  giveawayRoutesAvoidBroadSelect: Object.values(source).every(
    (text) => !broadSelect.test(text),
  ),
  listUsesNamedProjection: source.entries.includes("GIVEAWAY_ENTRY_FIELDS"),
  detailUsesNamedProjection:
    source.entryDetail.includes("GIVEAWAY_ENTRY_FIELDS") &&
    source.entryDetail.includes(".select(GIVEAWAY_ENTRY_FIELDS)"),
  bulkUsesNamedProjection:
    source.bulk.includes("GIVEAWAY_BULK_FIELDS") &&
    source.bulk.includes(".select(GIVEAWAY_BULK_FIELDS)"),
  routineProjectionsExcludeSensitiveEvidence: sensitiveFields.every(
    (field) =>
      !source.entries.match(new RegExp(`GIVEAWAY_ENTRY_FIELDS[^;]*${field}`)) &&
      !source.entryDetail.match(new RegExp(`GIVEAWAY_ENTRY_FIELDS[^;]*${field}`)) &&
      !source.bulk.match(new RegExp(`GIVEAWAY_BULK_FIELDS[^;]*${field}`)),
  detailDoesNotReturnInternalRepairPayloads:
    !source.entryDetail.includes("beta: sync.tester") &&
    !source.entryDetail.includes("sync,") &&
    !source.entryDetail.includes("repair: repaired"),
  bulkResultsDoNotEchoEmail:
    !source.bulk.includes("results.push({ id: entry.id, email: entry.email"),
  detailBoundsFreeText:
    source.entryDetail.includes("boundedText") &&
    source.entryDetail.includes("duplicate_reason = boundedText"),
};

const failed = Object.entries(checks)
  .filter(([, ok]) => !ok)
  .map(([name]) => name);

console.log(JSON.stringify({ checks, failed }, null, 2));
if (failed.length) process.exit(1);
