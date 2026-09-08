import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const broadSelect = /\.select\(\s*["'`]\*["'`]\s*\)/;

const files = {
  campaigns: "app/api/admin/marketing/campaigns/route.ts",
  campaignDetail: "app/api/admin/marketing/campaigns/[id]/route.ts",
  content: "app/api/admin/marketing/content/route.ts",
  contentDetail: "app/api/admin/marketing/content/[id]/route.ts",
  generate: "app/api/admin/marketing/content/[id]/generate/route.ts",
  reports: "app/api/admin/marketing/reports/route.ts",
};

const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const checks = {
  clusterAvoidsBroadSelect: Object.values(source).every((text) => !broadSelect.test(text)),
  campaignListUsesNamedProjection: source.campaigns.includes("CAMPAIGN_FIELDS") && source.campaigns.includes(".select(CAMPAIGN_FIELDS)"),
  campaignDetailNarrowsNestedRelations: source.campaignDetail.includes("MESSAGE_FIELDS") && source.campaignDetail.includes("SOCIAL_POST_FIELDS") && !source.campaignDetail.includes("marketing_messages(*)") && !source.campaignDetail.includes("social_posts(*)"),
  campaignResponsesHideGenerationInternals: !/CAMPAIGN_FIELDS[^\n]*generated_(prompt|payload)/.test(source.campaigns) && !/CAMPAIGN_FIELDS[^\n]*created_by_email/.test(source.campaigns),
  contentListUsesNamedProjection: source.content.includes("CONTENT_ITEM_FIELDS") && source.content.includes(".select(CONTENT_ITEM_FIELDS)"),
  contentDetailNarrowsPostsApprovalsAssets: source.contentDetail.includes("SOCIAL_POST_FIELDS") && source.contentDetail.includes("APPROVAL_FIELDS") && source.contentDetail.includes("ASSET_LINK_FIELDS"),
  contentPatchUsesExplicitAllowlist: source.contentDetail.includes("const writable = new Set") && !source.contentDetail.includes(".update(body)"),
  generationUsesMinimalResponse: source.generate.includes("CONTENT_GENERATION_FIELDS") && source.generate.includes("GENERATED_RESPONSE_FIELDS") && source.generate.includes("generatedText("),
  reportsUseNamedScheduleProjections: source.reports.includes("DUE_SCHEDULE_FIELDS") && source.reports.includes("SAVED_REPORT_FIELDS") && source.reports.includes("SCHEDULE_RESPONSE_FIELDS"),
  schedulerResponseDoesNotEchoRawError: source.reports.includes("results.push({ id: schedule.id, sent: false });") && !source.reports.includes("results.push({ id: schedule.id, sent: false, error: message })"),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ checks, failed }, null, 2));
if (failed.length) process.exit(1);
