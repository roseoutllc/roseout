import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const layout = read("app/locations/dashboard/layout.tsx");
const dashboard = read("app/locations/dashboard/page.tsx");
const supportPage = read("app/locations/dashboard/support/page.tsx");
const supportActions = read("app/locations/dashboard/support/actions.ts");
const ownerAccess = read("lib/auth/locationOwnerAccess.ts");

const checks = {
  dashboardLayoutRequiresAuthenticatedUser:
    layout.includes("auth.getUser()") && layout.includes("/login?next=/locations/dashboard"),
  dashboardUsesCentralOwnerAccess:
    dashboard.includes("getLocationOwnerAccess") && dashboard.includes("hasOwnerAccessToLocation"),
  supportPageRequiresLocationAccess:
    supportPage.includes("requireOwnerOrAdminAccessToLocation") &&
    supportPage.includes('.eq("user_id", user.id)') &&
    !supportPage.includes('.select("*")'),
  supportActionsRequireLocationAccess:
    supportActions.includes("requireOwnerOrAdminAccessToLocation") &&
    supportActions.includes('.eq("user_id", user.id)') &&
    !supportActions.includes("user_metadata") &&
    !supportActions.includes("owner_phone"),
  ownerAccessNeverTrustsUserMetadataForPrivileges:
    ownerAccess.includes("Only app_metadata is server-controlled") &&
    !/user_metadata\?\.(?:role|admin_role)/.test(ownerAccess),
};

const warnings = [];
if (dashboard.includes('select("*")')) warnings.push("dashboard page still contains broad select(*) helper reads; keep these aggregate-only and remove in a follow-up refactor");
if (/owner_(?:email|phone|name)/.test(dashboard)) warnings.push("dashboard location projection still references owner contact fields; avoid adding new client usage of these fields");

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ checks, warnings, failed }, null, 2));
if (failed.length) {
  console.error(`Location dashboard security audit failed: ${failed.join(", ")}`);
  process.exit(1);
}
