import fs from "node:fs";

const files = [
  "app/api/admin/search-anchors/route.ts",
  "app/api/admin/search-anchors/[id]/route.ts",
  "app/api/admin/search-anchors/[id]/approve/route.ts",
  "app/api/admin/search-anchors/[id]/disable/route.ts",
  "app/api/admin/search-anchors/[id]/merge/route.ts",
  "app/api/admin/search-benchmark/labels/route.ts",
  "lib/admin/search-security-projections.ts",
];

const text = Object.fromEntries(files.map((file) => [file, fs.readFileSync(file, "utf8")]));
const cluster = files.slice(0, 6).map((file) => text[file]).join("\n");
const checks = {
  clusterAvoidsBroadSelect: !cluster.includes('select("*")') && !cluster.includes("select('*')"),
  anchorListUsesNamedProjection: text[files[0]].includes("SEARCH_ANCHOR_LIST_FIELDS"),
  anchorDetailUsesNamedProjection: text[files[1]].includes("SEARCH_ANCHOR_DETAIL_FIELDS"),
  anchorPayloadIsAllowlisted: text[files[0]].includes("sanitizeSearchAnchorPayload") && text[files[1]].includes("sanitizeSearchAnchorPayload"),
  anchorMetadataIsBounded: text[files[6]].includes("serialized.length > 10_000"),
  anchorAliasesAreBounded: text[files[6]].includes("slice(0, 50)") && text[files[6]].includes("slice(0, 200)"),
  mergeRequiresValidTarget: text[files[4]].includes("Target anchor not found") && text[files[4]].includes("targetAnchorId === id"),
  mergeNotesAreBounded: text[files[4]].includes("boundedMergeNotes") && text[files[6]].includes("slice(0, 1000)"),
  benchmarkReadsUseNamedProjections: text[files[5]].includes("SEARCH_BENCHMARK_QUERY_FIELDS") && text[files[5]].includes("SEARCH_BENCHMARK_LABEL_FIELDS") && text[files[5]].includes("SEARCH_BENCHMARK_SCORECARD_FIELDS"),
  benchmarkLabelInputIsBounded: text[files[5]].includes("slice(0, 300)") && text[files[5]].includes("slice(0, 1000)"),
  benchmarkQueryMustExist: text[files[5]].includes('from("search_benchmark_queries").select("id")') && text[files[5]].includes("Benchmark query not found"),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ routes: 6, checks, failed }, null, 2));
if (failed.length) process.exit(1);
