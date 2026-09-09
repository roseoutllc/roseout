import fs from "node:fs";

const files = {
  audit: "app/api/admin/seo/audit/route.ts",
  issues: "app/api/admin/seo/issues/route.ts",
  runs: "app/api/admin/seo/runs/route.ts",
  setup: "app/api/admin/seo/setup/route.ts",
  page: "app/admin/dashboard/seo-tools/page.tsx",
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, fs.readFileSync(path, "utf8")]),
);
const cluster = Object.values(source).join("\n");
const apiCluster = [source.audit, source.issues, source.runs, source.setup].join("\n");

const checks = {
  apiClusterAvoidsBroadSelect:
    !apiCluster.includes('.select("*")') && !apiCluster.includes(".select('*')"),
  auditCreatesRunWithIdOnly:
    source.audit.includes('.select("id")') && source.audit.includes("RUN_RESPONSE_FIELDS"),
  auditBoundsFailureSurface:
    source.audit.includes("function bounded") && source.audit.includes("500"),
  auditPersistsReducedInspectionEvidence:
    source.audit.includes("inspectionEvidence") &&
    source.audit.includes("inspections.map(inspectionEvidence)"),
  issuesUseNamedProjection:
    source.issues.includes("ISSUE_FIELDS") && source.issues.includes(".select(ISSUE_FIELDS)"),
  issuesHideRawMetadata:
    !source.issues.includes('"metadata"') && !source.issues.includes("'metadata'"),
  runsUseNamedProjection:
    source.runs.includes("RUN_FIELDS") && source.runs.includes(".select(RUN_FIELDS)"),
  runsHideRawMetadata:
    !source.runs.includes('"metadata"') && !source.runs.includes("'metadata'"),
  setupUsesNamedProjection:
    source.setup.includes("SETUP_RUN_FIELDS") && source.setup.includes(".select(SETUP_RUN_FIELDS)"),
  setupHandlesInsertError:
    source.setup.includes("const { data, error }") && source.setup.includes("if (error)"),
  pageAvoidsBroadServiceRoleReads:
    !source.page.includes('.select("*")') && !source.page.includes(".select('*')"),
  pageUsesNamedSeoProjections:
    source.page.includes("PAGE_RUN_FIELDS") && source.page.includes("PAGE_ISSUE_FIELDS"),
};

const failed = Object.entries(checks)
  .filter(([, ok]) => !ok)
  .map(([name]) => name);

console.log(
  JSON.stringify(
    { routes: 4, pageSurfaces: 1, checks, failed },
    null,
    2,
  ),
);
if (failed.length) process.exit(1);
