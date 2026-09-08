import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const broadSelect = /\.select\(\s*["'`]\*["'`]\s*\)/;

const files = {
  list: "app/api/admin/promo-codes/route.ts",
  detail: "app/api/admin/promo-codes/[id]/route.ts",
  redemptions: "app/api/admin/promo-codes/[id]/redemptions/route.ts",
  page: "app/admin/dashboard/settings/promo-codes/page.tsx",
};

const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const checks = {
  promoRoutesAvoidBroadSelect: [source.list, source.detail, source.redemptions].every((text) => !broadSelect.test(text)),
  promoListUsesNamedProjection: source.list.includes("PROMO_LIST_FIELDS") && source.list.includes(".select(PROMO_LIST_FIELDS)"),
  userLookupMatchesProductionProfiles: source.list.includes('.select("id,email")') && !source.list.includes("full_name"),
  promoPatchIsAllowlisted: source.detail.includes("function buildPatch") && !source.detail.includes("update({ ...body") && !source.detail.includes(".update(body)"),
  promoDetailUsesNamedProjection: source.detail.includes("PROMO_DETAIL_FIELDS") && source.detail.includes(".select(PROMO_DETAIL_FIELDS)"),
  redemptionResponseExcludesMetadata: source.redemptions.includes("REDEMPTION_FIELDS") && !/REDEMPTION_FIELDS[^\n]*metadata/.test(source.redemptions),
  redemptionResponseIsBounded: source.redemptions.includes(".limit(500)"),
  userPickerIsEmailBased: source.page.includes('placeholder="Search by email"') && !source.page.includes("user.full_name"),
  inputTextIsBounded: source.list.includes("boundedText") && source.detail.includes("bounded("),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ checks, failed }, null, 2));
if (failed.length) process.exit(1);
