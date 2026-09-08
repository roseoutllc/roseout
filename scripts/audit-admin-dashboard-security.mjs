import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiRoot = path.join(root, "app", "api", "admin");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function constantArrayBlock(text, name) {
  const literalStart = text.indexOf(`const ${name} = "`);
  if (literalStart >= 0) {
    const literalEnd = text.indexOf('" as const;', literalStart);
    if (literalEnd >= 0) return text.slice(literalStart, literalEnd + 11);
  }
  const start = text.indexOf(`const ${name} = [`);
  if (start < 0) return "";
  const end = text.indexOf('].join(",")', start);
  return end < 0 ? "" : text.slice(start, end + 10);
}

const routeFiles = walk(apiRoot).filter((file) => file.endsWith("/route.ts"));
const handlerPattern = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g;
const guardCallPattern = /(?:requireAdminApiRole|requireSuperAdmin|requireAdminRole|requireAdminLocationApiRead|requireAdminLocationApiWrite|requireMarketingAdminApi|requireMarketingViewerApi|requireLocationPermission|getInternalDemoViewer|getAdminLoginRole|getCurrentAdmin|require[A-Za-z0-9_$]*Admin[A-Za-z0-9_$]*)\s*\(/;
const serviceRolePattern = /\b(?:supabaseAdmin|getSupabaseAdminClient)\b/;
const mutationPattern = /\.(?:insert|update|upsert|delete|rpc)\s*\(|\.functions\.invoke\s*\(/;
const broadSelectPattern = /\.select\(\s*["'`]\*["'`]\s*\)/;

const unguardedAdminRoutes = [];
const unguardedServiceRoleMutations = [];
const broadSelectWarnings = [];

for (const file of routeFiles) {
  const text = read(file);
  const handlers = [...text.matchAll(handlerPattern)].map((match) => match[1]);
  if (!handlers.length) continue;
  const hasGuard = guardCallPattern.test(text);
  if (!hasGuard) unguardedAdminRoutes.push({ file: rel(file), handlers });
  if (serviceRolePattern.test(text) && mutationPattern.test(text) && !hasGuard) unguardedServiceRoleMutations.push({ file: rel(file), handlers });
  if (broadSelectPattern.test(text)) broadSelectWarnings.push(rel(file));
}

const adminApiAuth = read(path.join(root, "lib", "admin-api-auth.ts"));
const adminPageAuth = read(path.join(root, "lib", "admin-auth.ts"));
const loginRole = read(path.join(root, "lib", "auth", "get-admin-login-role.ts"));
const internalDemoAccess = read(path.join(root, "lib", "demo", "internal-demo-access.ts"));
const usersRoute = read(path.join(root, "app", "api", "admin", "users", "route.ts"));
const adminLayout = read(path.join(root, "app", "admin", "layout.tsx"));
const betaApplications = read(path.join(root, "app", "api", "admin", "beta", "applications", "route.ts"));
const betaTesters = read(path.join(root, "app", "api", "admin", "beta", "testers", "route.ts"));
const supportList = read(path.join(root, "app", "api", "admin", "support-tickets", "route.ts"));
const supportDetail = read(path.join(root, "app", "api", "admin", "support", "tickets", "[ticketId]", "route.ts"));
const supportReply = read(path.join(root, "app", "api", "admin", "support-tickets", "[id]", "reply", "route.ts"));
const emailLogs = read(path.join(root, "app", "api", "admin", "email", "logs", "route.ts"));
const smsSend = read(path.join(root, "app", "api", "admin", "crm", "sms", "send", "route.ts"));
const reservePortalReservations = read(path.join(root, "app", "api", "reserve", "portal", "reservations", "route.ts"));
const supportToolLayer = read(path.join(root, "lib", "support", "tool-layer.ts"));
const supportIdentity = read(path.join(root, "lib", "support", "identity-verification.ts"));
const crmSmsComposer = read(path.join(root, "app", "admin", "dashboard", "crm", "[id]", "CrmSmsComposer.tsx"));
const crmContactCreate = read(path.join(root, "app", "admin", "dashboard", "crm", "contacts", "new", "actions.ts"));

const usersGuardIndex = usersRoute.indexOf("requireAdminApiRole(ADMIN_PAGE_ACCESS.adminUsers)");
const customerBranchIndex = usersRoute.indexOf('url.searchParams.get("customer")');
const canonicalOnly = (text) => text.includes('.from("admin_users")') && text.includes('.eq("user_id", user.id)') && !text.includes("user_metadata?.role") && !text.includes("user_metadata?.admin_role") && !text.includes('.eq("email", user.email)') && !text.includes('.ilike("email", user.email)');
const noBroadSelect = (text) => !broadSelectPattern.test(text);
const reservationViewBlock = constantArrayBlock(reservePortalReservations, "RESERVATION_VIEW_FIELDS");
const sensitiveReservationFields = /customer_token|stripe_payment_method_id|stripe_setup_intent_id|stripe_payment_intent_id|deposit_connected_account_id|deposit_refund_id|guarantee_charge_payment_intent_id/;

const checks = {
  adminLayoutRequiresAuthenticatedAdmin: adminLayout.includes("requireAdminRole(ADMIN_PAGE_ACCESS.dashboard)"),
  adminPageAuthUsesCanonicalAdminUsers: canonicalOnly(adminPageAuth),
  adminApiAuthUsesCanonicalAdminUsersOnly: canonicalOnly(adminApiAuth) && !adminApiAuth.includes("FALLBACK_ROLE_LOOKUPS") && !adminApiAuth.includes("findFallbackRole"),
  adminLoginRoleUsesCanonicalAdminUsersOnly: canonicalOnly(loginRole) && !loginRole.includes("roleFromMetadata") && !loginRole.includes("authAdminRoleFromSupabase"),
  internalDemoAccessUsesCanonicalAdminUsersOnly: canonicalOnly(internalDemoAccess) && !internalDemoAccess.includes('.from("users")'),
  adminUsersCustomerViewAuthorizedBeforeRead: usersGuardIndex >= 0 && customerBranchIndex >= 0 && usersGuardIndex < customerBranchIndex,
  allAdminApiRoutesHaveAuthGuard: unguardedAdminRoutes.length === 0,
  allServiceRoleAdminMutationsHaveAuthGuard: unguardedServiceRoleMutations.length === 0,
  highRiskPiiRoutesAvoidBroadSelect: [betaApplications, betaTesters, supportList, supportDetail, supportReply, emailLogs].every(noBroadSelect),
  smsSendBindsRecipientToLocationRelationship: smsSend.includes('.from("crm_account_locations")') && smsSend.includes('.from("crm_account_contacts")') && smsSend.includes('.in("id", contactIds)') && smsSend.includes('.eq("phone_e164", to)') && smsSend.includes("not an active CRM contact for the selected location"),
  smsSendDoesNotPersistRawProviderPayload: !smsSend.includes("sent.raw"),
  crmNoNumberFlowLinksContactToLocationAccount: crmSmsComposer.includes("Add / verify SMS contact") && crmContactCreate.includes('.from("crm_account_locations")') && crmContactCreate.includes('.from("crm_account_contacts")') && crmContactCreate.includes("phone_e164"),
  reservationListAvoidsBroadSelect: noBroadSelect(reservePortalReservations),
  reservationResponsesHideSensitivePaymentAndTokenFields: Boolean(reservationViewBlock) && !sensitiveReservationFields.test(reservationViewBlock),
  reservationAuditSanitizesPaymentMethod: reservePortalReservations.includes("sanitizeReservationForAudit") && reservePortalReservations.includes("stripe_payment_method_id: _paymentMethod"),
  sensitiveSupportRunsIdentityGateBeforeOtherTools: supportToolLayer.includes("getSupportIdentityGateDecision") && supportToolLayer.indexOf("getSupportIdentityGateDecision") < supportToolLayer.indexOf("isResolutionMessage(latestMessage)"),
  supportVerificationIsScopedAndExpiring: supportIdentity.includes('scope: `reservation:${reservation.id}`') && supportIdentity.includes("VERIFIED_TTL_MS") && supportIdentity.includes("verified_until") && supportIdentity.includes("hasActiveSupportVerification"),
  supportReservationVerificationUsesSecondFactor: supportIdentity.includes("confirmationCode") && supportIdentity.includes("reservation.customer_email") && supportIdentity.includes("reservation.customer_phone") && supportIdentity.includes("requesterPhone === reservationPhone"),
  supportAccountLookupDoesNotEnumerateExistence: supportIdentity.includes("I won’t confirm whether an account exists") && supportIdentity.includes("If that address matches your account"),
  supportOtpIsHashedAndAttemptLimited: supportIdentity.includes("crypto.scryptSync") && supportIdentity.includes("crypto.timingSafeEqual") && supportIdentity.includes("MAX_ATTEMPTS") && supportIdentity.includes("VERIFICATION_TTL_MS"),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const report = { adminApiRouteCount: routeFiles.length, checks, unguardedAdminRoutes, unguardedServiceRoleMutations, broadSelectWarningCount: broadSelectWarnings.length, broadSelectWarnings, failed };
console.log(JSON.stringify(report, null, 2));

if (process.env.GITHUB_STEP_SUMMARY) {
  const unguarded = unguardedAdminRoutes.map((item) => `- \`${item.file}\` (${item.handlers.join(", ")})`).join("\n") || "- None";
  const serviceRole = unguardedServiceRoleMutations.map((item) => `- \`${item.file}\``).join("\n") || "- None";
  const broad = broadSelectWarnings.slice(0, 40).map((file) => `- \`${file}\``).join("\n") || "- None";
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Admin dashboard security parity audit\n\n- Admin API routes scanned: **${routeFiles.length}**\n- Unguarded admin routes: **${unguardedAdminRoutes.length}**\n- Unguarded service-role mutations: **${unguardedServiceRoleMutations.length}**\n- Broad select warnings: **${broadSelectWarnings.length}**\n- High-risk PII/SMS/Reservation/Support verification checks: **${failed.length ? "FAILED" : "PASS"}**\n\n#### Unguarded routes\n${unguarded}\n\n#### Unguarded service-role mutations\n${serviceRole}\n\n#### Broad-select review warnings\n${broad}\n`);
}

if (failed.length) process.exit(1);
