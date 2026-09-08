import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const adminRoot = path.join(root, 'app', 'admin', 'dashboard');
const componentRoot = path.join(root, 'components', 'admin');

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

const pages = walk(adminRoot).filter((file) => file.endsWith('/page.tsx'));
const tsFiles = walk(root).filter((file) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(file) && !file.includes('/node_modules/'));
const sourceCache = new Map(tsFiles.map((file) => [file, read(file)]));

const awaitHotspots = [];
const responsiveRisk = [];
const themeRisk = [];

for (const file of pages) {
  const text = sourceCache.get(file) || '';
  const awaits = (text.match(/\bawait\b/g) || []).length;
  if (awaits >= 8) awaitHotspots.push({ file: rel(file), awaits });
  if (/min-w-\[|w-\[(?:[7-9]\d\d|\d{4,})px\]|grid-cols-\[[^\]]{40,}\]/.test(text)) {
    responsiveRisk.push(rel(file));
  }
  if (/bg-(?:black|neutral-9|zinc-9|slate-9|gray-9)|bg-\[#0|text-white/.test(text)) {
    themeRisk.push(rel(file));
  }
}

awaitHotspots.sort((a, b) => b.awaits - a.awaits || a.file.localeCompare(b.file));

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

const structuralChecks = {
  responsiveLayerImported: layout.includes('./admin-responsive.css'),
  themeCompatImported: layout.includes('./admin-theme-compat.css'),
  rolesPageProtected: rolesPage.includes('requireAdminRole(ADMIN_PAGE_ACCESS.roles)'),
  rolesDataParallelized: rolesPage.includes('Promise.all(['),
  roleCreateRequiresSuperadmin: roleMembersRoute.includes('requireSuperAdmin()'),
  roleMutationRequiresSuperadmin: roleMemberRoute.includes('requireSuperAdmin()'),
};

const report = {
  generatedAt: new Date().toISOString(),
  routeCount: pages.length,
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
  const topAwait = awaitHotspots.slice(0, 12).map((item) => `| \`${item.file}\` | ${item.awaits} |`).join('\n') || '| None | 0 |';
  const unused = unusedAdminComponents.slice(0, 20).map((file) => `- \`${file}\``).join('\n') || '- None';
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Admin dashboard hardening audit\n\n- Routes: **${pages.length}**\n- Responsive-risk pages: **${responsiveRisk.length}**\n- Theme-risk pages: **${themeRisk.length}**\n- Unused admin component candidates: **${unusedAdminComponents.length}**\n\n#### Highest await counts\n\n| Route | awaits |\n| --- | ---: |\n${topAwait}\n\n#### Unused component candidates\n${unused}\n`);
}

const failed = Object.entries(structuralChecks).filter(([, ok]) => !ok);
if (failed.length) {
  console.error(`Admin hardening structural checks failed: ${failed.map(([key]) => key).join(', ')}`);
  process.exit(1);
}
