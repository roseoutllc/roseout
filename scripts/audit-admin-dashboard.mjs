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

function normalizeHex(hex) {
  const raw = hex.toLowerCase();
  if (raw.length === 3 || raw.length === 4) return raw.slice(0, 3).split('').map((char) => char + char).join('');
  return raw.slice(0, 6);
}

function isDarkHex(hex) {
  const normalized = normalizeHex(hex);
  if (!/^[0-9a-f]{6}$/.test(normalized)) return false;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.32;
}

function arbitraryDarkBackgrounds(text) {
  return [...new Set(
    [...text.matchAll(/bg-\[#([0-9a-fA-F]{3,8})\]/g)]
      .map((match) => `bg-[#${match[1].toLowerCase()}]`)
      .filter((token) => isDarkHex(token.slice(5, -1))),
  )].sort();
}

function responsiveHazards(text) {
  const hazards = [];
  const widePattern = /(?:min-w|w)-\[(?:[7-9]\d\d|\d{4,})px\]|grid-cols-\[[^\]]{40,}\]/g;
  for (const match of text.matchAll(widePattern)) {
    if (match.index == null) continue;
    const token = match[0];
    const before = text.slice(Math.max(0, match.index - 1200), match.index);
    if (token.startsWith('w-[') && before.endsWith('max-')) continue;
    const safelyScrollable = /overflow-x-auto|overflow-auto|AdminDataTableShell/.test(before);
    if (!token.startsWith('grid-cols-[') && safelyScrollable) continue;
    hazards.push(token);
  }
  return [...new Set(hazards)].sort();
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

const appearanceCssFiles = [
  'admin-appearance.css',
  'admin-appearance-legacy.css',
  'admin-appearance-status.css',
  'admin-appearance-route-fixes.css',
  'admin-theme-compat.css',
].map((name) => path.join(root, 'app', 'admin', name));
const appearanceCoverageSource = appearanceCssFiles
  .filter((file) => fs.existsSync(file))
  .map((file) => read(file).replaceAll('\\', ''))
  .join('\n');
const coveredDarkBackgrounds = new Set(arbitraryDarkBackgrounds(appearanceCoverageSource));

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
  const hazards = responsiveHazards(text);
  if (hazards.length) {
    responsiveRisk.push({ file: rel(file), hazards });
  }
  const uncoveredBackgrounds = arbitraryDarkBackgrounds(text).filter((token) => !coveredDarkBackgrounds.has(token));
  if (uncoveredBackgrounds.length) {
    themeRisk.push({ file: rel(file), uncoveredBackgrounds });
  }
}

awaitHotspots.sort((a, b) => b.renderAwaits - a.renderAwaits || b.totalAwaits - a.totalAwaits || a.file.localeCompare(b.file));
const navigationThemeRisk = navigationEntrypoints
  .map((route) => {
    const file = pageRoutes.get(route);
    if (!file) return null;
    const risk = themeRisk.find((item) => item.file === rel(file));
    return risk ? { route, ...risk } : null;
  })
  .filter(Boolean);
const navigationResponsiveRisk = navigationEntrypoints
  .map((route) => {
    const file = pageRoutes.get(route);
    if (!file) return null;
    const risk = responsiveRisk.find((item) => item.file === rel(file));
    return risk ? { route, ...risk } : null;
  })
  .filter(Boolean);

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
  navigationResponsiveRiskCount: navigationResponsiveRisk.length,
  navigationResponsiveRisk,
  themeRiskCount: themeRisk.length,
  themeRisk,
  navigationThemeRiskCount: navigationThemeRisk.length,
  navigationThemeRisk,
  coveredDarkBackgrounds: [...coveredDarkBackgrounds].sort(),
  unusedAdminComponents,
  structuralChecks,
};

console.log(JSON.stringify(report, null, 2));

if (process.env.GITHUB_STEP_SUMMARY) {
  const topAwait = awaitHotspots.slice(0, 12).map((item) => `| \`${item.file}\` | ${item.renderAwaits} | ${item.totalAwaits} |`).join('\n') || '| None | 0 | 0 |';
  const unused = unusedAdminComponents.slice(0, 20).map((file) => `- \`${file}\``).join('\n') || '- None';
  const orphans = orphanReviewCandidates.slice(0, 30).map((route) => `- \`${route}\``).join('\n') || '- None';
  const themeItems = navigationThemeRisk.slice(0, 20).map((item) => `- \`${item.route}\`: ${item.uncoveredBackgrounds.map((token) => `\`${token}\``).join(', ')}`).join('\n') || '- None';
  const responsiveItems = navigationResponsiveRisk.slice(0, 20).map((item) => `- \`${item.route}\`: ${item.hazards.map((token) => `\`${token}\``).join(', ')}`).join('\n') || '- None';
  const classifications = Object.entries(routesByClassification).map(([classification, routes]) => `- ${classification.replaceAll('_', ' ')}: **${routes.length}**`).join('\n');
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Admin dashboard hardening audit\n\n- Filesystem routes: **${pages.length}**\n- Primary navigation entry points: **${navigationEntrypoints.length}**\n- Static orphan review candidates: **${orphanReviewCandidates.length}**\n- Manually reviewed hidden operational tools: **${reviewedHiddenOperationalRoutes.size}**\n- Responsive-risk filesystem pages: **${responsiveRisk.length}**\n- Responsive-risk navigation destinations: **${navigationResponsiveRisk.length}**\n- Uncovered theme-risk filesystem pages: **${themeRisk.length}**\n- Uncovered theme-risk navigation destinations: **${navigationThemeRisk.length}**\n- Unused admin component candidates: **${unusedAdminComponents.length}**\n\n> Theme risk reports only dark arbitrary background colors not already normalized by the Admin appearance compatibility layers. Responsive risk ignores intentionally wide tables and data grids that are already contained by horizontal scrolling, plus ordinary `max-w-*` content caps. Filesystem route count is not the number of admin pages actively used.\n\n#### Route classification\n${classifications}\n\n#### Highest await counts\n\n| Route | render awaits | total file awaits |\n| --- | ---: | ---: |\n${topAwait}\n\n#### Navigation theme risks\n${themeItems}\n\n#### Navigation responsive risks\n${responsiveItems}\n\n#### Static orphan review candidates\n${orphans}\n\n#### Unused component candidates\n${unused}\n`);
}

const failed = Object.entries(structuralChecks).filter(([, ok]) => !ok);
if (failed.length) {
  console.error(`Admin hardening structural checks failed: ${failed.map(([key]) => key).join(', ')}`);
  process.exit(1);
}
