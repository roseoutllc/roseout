import fs from "node:fs";

const files = [
  "app/api/admin/feature-flags/route.ts",
  "app/api/admin/feature-flags/[id]/route.ts",
  "app/api/admin/feature-flags/[id]/toggle/route.ts",
  "app/api/admin/feature-flags/audit-logs/route.ts",
  "app/api/admin/cron-jobs/route.ts",
  "app/api/admin/cron-jobs/[jobKey]/route.ts",
  "app/api/admin/cron-jobs/[jobKey]/runs/route.ts",
  "app/api/admin/logs/route.ts",
  "app/api/admin/workers/jobs/[id]/route.ts",
  "app/api/admin/workers/jobs/[id]/events/route.ts",
];

const source = Object.fromEntries(files.map((file) => [file, fs.readFileSync(file, "utf8")]));
const cluster = Object.values(source).join("\n");
const feature = [source[files[0]], source[files[1]], source[files[2]], source[files[3]]].join("\n");
const cron = [source[files[4]], source[files[5]], source[files[6]]].join("\n");
const logs = source[files[7]];
const workers = [source[files[8]], source[files[9]]].join("\n");
const workerJobProjection = source[files[8]].match(/const WORKER_JOB_FIELDS = "([^"]+)"/)?.[1] || "";
const workerJobFields = workerJobProjection.split(",").map((field) => field.trim()).filter(Boolean);

const checks = {
  clusterAvoidsBroadSelect: !/\.select\(\s*["'`]\*["'`]\s*\)/.test(cluster),
  featureFlagsExcludeRawMetadata: /FEATURE_FLAG_FIELDS/.test(feature) && !/FEATURE_FLAG_FIELDS[^\n]*metadata/.test(feature),
  featureFlagMutationsAreBounded: /boundedText/.test(source[files[0]]) && /boundedText/.test(source[files[1]]),
  featureToggleUsesMinimalLookup: /select\(["']id,key,enabled["']\)/.test(source[files[2]]),
  cronJobsUseNamedProjection: /CRON_JOB_FIELDS/.test(cron) && !/select\(["']\*["']\)/.test(cron),
  cronRunHistoryExcludesRawInternals: /CRON_RUN_FIELDS/.test(source[files[6]]) && !/error_stack|response_excerpt|request_id|metadata/.test(source[files[6]].match(/const CRON_RUN_FIELDS[^;]+;/)?.[0] || ""),
  adminLogsExcludeMetadata: /ADMIN_LOG_FIELDS/.test(logs) && !/ADMIN_LOG_FIELDS[^\n]*metadata/.test(logs),
  workerJobResponseExcludesPayloads: workerJobFields.length > 0 && !workerJobFields.some((field) => ["payload", "result", "checkpoint"].includes(field)),
  workerEventsExcludeMetadata: /WORKER_EVENT_FIELDS/.test(workers) && !/WORKER_EVENT_FIELDS[^\n]*metadata/.test(workers),
  cronRecipientListIsBounded: /\.slice\(0, 20\)/.test(source[files[5]]),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ checks, failed }, null, 2));
if (failed.length) process.exit(1);
