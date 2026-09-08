import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['Unified Demo Center layout', 'app/admin/dashboard/settings/demo-center/layout.tsx'],
  ['Unified Demo Center actions', 'app/admin/dashboard/settings/demo-center/actions.ts'],
  ['Team Demo workspace', 'app/admin/dashboard/team/demo/page.tsx'],
  ['Team Demo reservation preview', 'app/admin/dashboard/team/demo/[sessionId]/reservations/page.tsx'],
];

const failures = [];
for (const [label, relativePath] of checks) {
  const text = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const hasManagerGuard = text.includes('requireAdminRole(ADMIN_PAGE_ACCESS.teamManagement)');
  const hasBroadDashboardGuard = text.includes('requireAdminRole(ADMIN_PAGE_ACCESS.dashboard)');
  if (!hasManagerGuard || hasBroadDashboardGuard) {
    failures.push({ label, relativePath, hasManagerGuard, hasBroadDashboardGuard });
  }
}

if (failures.length) {
  console.error('Admin demo boundary audit failed:');
  for (const failure of failures) {
    console.error(`- ${failure.relativePath}: managerGuard=${failure.hasManagerGuard}, broadDashboardGuard=${failure.hasBroadDashboardGuard}`);
  }
  process.exit(1);
}

console.log(`Admin demo boundary audit passed (${checks.length} protected surfaces).`);
