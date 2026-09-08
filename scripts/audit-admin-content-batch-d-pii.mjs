import fs from "node:fs";

const files = [
  "app/api/admin/business-analytics/route.ts",
  "app/api/admin/campaigns/route.ts",
  "app/api/admin/communication/templates/route.ts",
  "app/api/admin/featured-outings/route.ts",
  "app/api/admin/knowledge-base/articles/route.ts",
  "app/api/admin/knowledge-base/articles/[id]/route.ts",
  "app/api/admin/knowledge-base/categories/route.ts",
  "app/api/admin/knowledge-base/templates/render/route.ts",
];

const source = Object.fromEntries(files.map((file) => [file, fs.readFileSync(file, "utf8")]));
const joined = files.map((file) => source[file]).join("\n");

const checks = {
  clusterAvoidsBroadSelect: !joined.includes('.select("*")') && !joined.includes(".select('*')"),
  businessAnalyticsUsesNamedReads: source[files[0]].includes("LOCATION_FIELDS") && source[files[0]].includes("EVENT_FIELDS") && source[files[0]].includes("OUTING_FIELDS"),
  campaignsUseNamedProjection: source[files[1]].includes("CAMPAIGN_FIELDS") && source[files[1]].includes(".select(CAMPAIGN_FIELDS)"),
  communicationTemplatesUseNamedProjection: source[files[2]].includes("TEMPLATE_FIELDS") && source[files[2]].includes(".select(TEMPLATE_FIELDS)"),
  communicationTemplateInputIsBounded: source[files[2]].includes("slice(0, 12000)") && source[files[2]].includes("slice(0, 240)"),
  featuredOutingsUseNamedProjection: source[files[3]].includes("FEATURED_OUTING_FIELDS") && source[files[3]].includes(".select(FEATURED_OUTING_FIELDS)"),
  kbArticleCreateUsesNamedProjection: source[files[4]].includes(".select(KB_SELECT)"),
  kbArticleDetailUsesNamedProjection: source[files[5]].includes("KB_VERSION_SOURCE_FIELDS") && source[files[5]].includes(".select(KB_SELECT)"),
  kbCategoryResponsesUseNamedProjection: source[files[6]].includes("CATEGORY_FIELDS") && source[files[6]].includes(".select(CATEGORY_FIELDS)"),
  kbTemplateRenderUsesMinimalFields: source[files[7]].includes("TEMPLATE_RENDER_FIELDS") && source[files[7]].includes(".select(TEMPLATE_RENDER_FIELDS)"),
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([name]) => name);
console.log(JSON.stringify({ routes: files.length, checks, failed }, null, 2));
if (failed.length) process.exit(1);
