import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const adminRoot = path.join(root, 'app', 'admin', 'dashboard');
const componentRoot = path.join(root, 'components', 'admin');

const reviewedHiddenOperationalRoutes = new Set([
  '/admin/dashboard/careers/internships/active',
  '/admin/dashboard/careers/internships/assignments',
  '/admin/dashboard/careers/internships/compliance',
  '/admin/dashboard/communication',
  '/admin/dashboard/crm/claim-codes',
  '/admin/dashboard/crm/communications/automation/settings',
  '/admin/dashboard/experiences',
  '/admin/dashboard/feature-flags',
  '/admin/dashboard/location-layout/create',
  '/admin/dashboard/marketing/analytics',
  '/admin/dashboard/marketing/featured-outings',
  '/admin/dashboard/operations/users',
  '/admin/dashboard/reviews',
  '/admin/dashboard/search-anchors/verification',
  '/admin/dashboard/seo-tools',
  '/admin/dashboard/sms',
  '/admin/dashboard/team/escalations',
  '/admin/dashboard/team/location-change-requests',
  '/admin/dashboard/team/password-reset-audit',
  '/admin/dashboard/team/performance',
  '/admin/dashboard/team/proof-review',
  '/admin/dashboard/team/settings',
  '/admin/dashboard/team/tasks',
]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function pageFileToRoute(file) {
  return `/${rel(file).replace(/^app\//, '').replace(/\/page\.tsx$/, '')}`;
}

function countAwaits(text) {
  return (text.match(/\bawait\b/g) || []).length;
}

function getDefaultPageFunction(text) {
  const match = text.match(/export\s+default\s+async\s+function\s+[A-Za-z0-9_$]*\s*\(/);
  if (!match || match.index == null) return '';

  const start = match.index;
  const bodyStart = text.indexOf('{', start + match[0].length);
  if (bodyStart < 0) return text.slice(start);

  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = bodyStart; i < text.length; i += 1) {
    const char = text[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return text.slice(start);
}

const pages = walk(adminRoot).filter((file) => file.endsWith('/page.tsx'));
const tsFiles = walk(root).filter((file) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(file) && !file.includes('/node_modules/'));
const sourceCache = new Map(tsFiles.map((file) => [file, read(file)]));

const navigationSource = read(path.join(root, 'app', 'admin', 'admin-navigation.ts'));
const navigationEntrypoints = [...new Set(
  [...navigationSource.matchAll(/href:\s*["'`](\/admin\/dashboard[^"'`]*)["'`]/g)]
    .map((match) => match[1].split('?')[0]),
)].sort();

const pageRoutes = new Map(pages.map((file) => [pageFileToRoute(file), file]));
const navigationRoutesWithPages = navigationEntrypoints.filter((route) => pageRoutes.has(route));
const navigationRoutesMissingPages = navigationEntrypoints.filter((route) => !pageRoutes.has(route));

const routeReferenceCounts = new Map();
for (const route of pageRoutes.keys()) routeReferenceCounts.set(route, 0);
for (const [file, text] of sourceCache) {
  if (rel(file) === 'app/admin/admin-navigation.ts') continue;
  for (const route of pageRoutes.keys()) {
    if (text.includes(route)) routeReferenceCounts.set(route, (routeReferenceCounts.get(route) || 0) + 1);
  }
}

function classifyRoute(route, file) {
  const text = sourceCache.get(file) || '';
  const refs = routeReferenceCounts.get(route) || 0;
  if (route === '/admin/dashboard' || navigationEntrypoints.includes(route)) return 'navigation_entrypoint';
  if (/\/(?:print|export)(?:\/|$)/.test(route)) return 'print_export';
  if (route.includes('[')) return 'dynamic_detail_workflow';
  if (reviewedHiddenOperationalRoutes.has(route)) return 'hidden_operational_tool';

  const compact = text.replace(/\s+/g, ' ');
  const hasRedirect = /\bredirect\s*\(/.test(text);
  const hasDefaultReexport = /export\s*\{\s*default\s*\}\s*from\s*["'`]/.test(text);
  const hasMeaningfulUi = /<(?:main|section|article|AdminPageShell|AdminSectionCard|div)\b/.test(text);
  if (hasDefaultReexport) return 'redirect_alias';
  if (hasRedirect && (!hasMeaningfulUi || compact.length < 1800)) return 'redirect_alias';
  if (refs > 0) return 'hidden_operational_tool';
  return 'orphan_candidate';
}

const routeClassifications = [...pageRoutes.entries()]
  .map(([route, file]) => ({
    route,
    classification: classifyRoute(route, file),
    references: routeReferenceCounts.get(route) || 0,
  }))
  .sort((a, b) => a.route.localeCompare(b.route));

const routesByClassification = Object.fromEntries(
  [...new Set(routeClassifications.map((item) => item.classification))]
    .sort()
    .map((classification) => [
      classification,
      routeClassifications.filter((item) => item.classification === classification).map((item) => item.route),
    ]),
);

const orphanReviewCandidates = routeClassifications
  .filter((item) => item.classification === 'orphan_candidate')
  .map((item) => item.route);

const awaitHotspots = [];
const responsiveRisk = [];
const themeRisk = [];

for (const file of pages) {
  const text = sourceCache.get(file) || '';
  const totalAwaits = countAwaits(text);
  const renderAwaits = countAwaits(getDefaultPageFunction(text));
  if (renderAwaits >= 5 || totalAwaits >= 8) {
    awaitHotspots.push({ file: rel(file), renderAwaits, totalAwaits });
  }
  if (/min-w-\[|w-\[(?:[7-9]\d\d|\d{4,})px\]|grid-cols-\[[^\]]{40,}\]/.test(text)) {
    responsiveRisk.push(rel(file));
  }
  if (/bg-(?:black|neutral-9|zinc-9|slate-9|gray-9)|bg-\[#0|text-white/.test(text)) {
    themeRisk.push(rel(file));
  }
}

awaitHotspots.sort((a, b) => b.renderAwaits - a.renderAwaits || b.totalAwaits - a.totalAwaits || a.file.localeCompare(b.file));

const unusedAdminComponents = [];
const adminComponents = walk(componentRoot).filter((file) => /\.(?:ts|tsx)$/.test(file) && !/\.test\.(?:ts|tsx)$/.test(file));
for (const file of adminComponents) {
  const relativeNoExt = rel(file).replace(/\.(?:ts|tsx)$/, '');
  const stem = path.basename(relativeNoExt);
  const importPath = `@/${relativeNoExt}`;
  let referenced = false;
  for (const [other, text] of sourceCache) {
    if (other === file) continue;
    if (text.includes(importPath) || text.includes(stem)) {
      referenced = true;
      break;
    }
  }
  if (!referenced) unusedAdminComponents.push(rel(file));
}

const layout = read(path.join(root, 'app', 'admin', 'layout.tsx'));
const rolesPage = read(path.join(root, 'app', 'admin', 'dashboard', 'roles', 'page.tsx'));
const roleMembersRoute = read(path.join(root, 'app', 'api', 'admin', 'system', 'role-members', 'route.ts'));
const roleMemberRoute = read(path.join(root, 'app', 'api', 'admin', 'system', 'role-members', '[adminId]', 'route.ts'));
const searchAnchorsLayout = read(path.join(root, 'app', 'admin', 'dashboard', 'search-anchors', 'layout.tsx'));
const crmAutomationLayout = read(path.join(root, 'app', 'admin', 'dashboard', 'crm', 'communications', 'automation', 'layout.tsx'));
const adminPermissions = read(path.join(root, 'lib', 'admin-permissions.ts'));
const teamManagerPages = [
  'escalations',
  'location-change-requests',
  'performance',
  'proof-review',
  'settings',
  'tasks',
].map((name) => read(path.join(root, 'app', 'admin', 'dashboard', 'team', name, 'page.tsx')));
const passwordResetAuditPage = read(path.join(root, 'app', 'admin', 'dashboard', 'team', 'password-reset-audit', 'page.tsx'));

const structuralChecks = {
  responsiveLayerImported: layout.includes('./admin-responsive.css'),
  themeCompatImported: layout.includes('./admin-theme-compat.css'),
  rolesPageProtected: rolesPage.includes('requireAdminRole(ADMIN_PAGE_ACCESS.roles)'),
  rolesDataParallelized: rolesPage.includes('Promise.all(['),
  roleCreateRequiresSuperadmin: roleMembersRoute.includes('requireSuperAdmin()'),
  roleMutationRequiresSuperadmin: roleMemberRoute.includes('requireSuperAdmin()'),
  searchAnchorsWorkspaceProtected: searchAnchorsLayout.includes('requireAdminRole(ADMIN_PAGE_ACCESS.dataQuality)'),
  crmAutomationWorkspaceProtected: crmAutomationLayout.includes('requireAdminRole(ADMIN_PAGE_ACCESS.communicationSend)'),
  teamManagementPermissionDefined: adminPermissions.includes('teamManagement: ["superadmin", "admin", "manager"]'),
  teamSecurityAuditPermissionDefined: adminPermissions.includes('teamSecurityAudit: ["superadmin", "admin"]'),
  teamManagerPagesProtected: teamManagerPages.every((text) => text.includes('requireAdminRole(ADMIN_PAGE_ACCESS.teamManagement)')),
  passwordResetAuditProtected: passwordResetAuditPage.includes('requireAdminRole(ADMIN_PAGE_ACCESS.teamSecurityAudit)'),
  navigationEntrypointsResolve: navigationRoutesMissingPages.length === 0,
  reviewedHiddenOperationalRoutesResolve: [...reviewedHiddenOperationalRoutes].every((route) => pageRoutes.has(route)),
};

const report = {
  generatedAt: new Date().toISOString(),
  filesystemRouteCount: pages.length,
  navigationEntrypointCount: navigationEntrypoints.length,
  navigationEntrypoints,
  navigationRoutesWithPages,
  navigationRoutesMissingPages,
  reviewedHiddenOperationalRoutes: [...reviewedHiddenOperationalRoutes].sort(),
  routeClassificationCounts: Object.fromEntries(
    Object.entries(routesByClassification).map(([classification, routes]) => [classification, routes.length]),
  ),
  routesByClassification,
  routeClassifications,
  orphanReviewCandidateCount: orphanReviewCandidates.length,
  orphanReviewCandidates,
  awaitHotspots,
  responsiveRiskCount: responsiveRisk.length,
  responsiveRisk,
  themeRiskCount: themeRisk.length,
  themeRisk,
  unusedAdminComponents,
  structuralChecks,
};

console.log(JSON.stringify(report, null, 2));

if (process.env.GITHUB_STEP_SUMMARY) {
  const topAwait = awaitHotspots.slice(0, 12).map((item) => `| \`${item.file}\` | ${item.renderAwaits} | ${item.totalAwaits} |`).join('\n') || '| None | 0 | 0 |';
  const unused = unusedAdminComponents.slice(0, 20).map((file) => `- \`${file}\``).join('\n') || '- None';
  const orphans = orphanReviewCandidates.slice(0, 30).map((route) => `- \`${route}\``).join('\n') || '- None';
  const classifications = Object.entries(routesByClassification).map(([classification, routes]) => `- ${classification.replaceAll('_', ' ')}: **${routes.length}**`).join('\n');
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Admin dashboard hardening audit\n\n- Filesystem routes: **${pages.length}**\n- Primary navigation entry points: **${navigationEntrypoints.length}**\n- Static orphan review candidates: **${orphanReviewCandidates.length}**\n- Manually reviewed hidden operational tools: **${reviewedHiddenOperationalRoutes.size}**\n- Responsive-risk pages: **${responsiveRisk.length}**\n- Theme-risk pages: **${themeRisk.length}**\n- Unused admin component candidates: **${unusedAdminComponents.length}**\n\n> Filesystem route count is not the number of admin pages actively used. Navigation entry points represent the intentional top-level admin surface; child/detail routes are classified separately. Orphan candidates remain review-only until replacement parity and business-logic ownership are proven.\n\n#### Route classification\n${classifications}\n\n#### Highest await counts\n\n| Route | render awaits | total file awaits |\n| --- | ---: | ---: |\n${topAwait}\n\n#### Static orphan review candidates\n${orphans}\n\n#### Unused component candidates\n${unused}\n`);
}

const failed = Object.entries(structuralChecks).filter(([, ok]) => !ok);
if (failed.length) {
  console.error(`Admin hardening structural checks failed: ${failed.map(([key]) => key).join(', ')}`);
  process.exit(1);
}
