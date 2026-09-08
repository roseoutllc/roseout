import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const broadSelect = /\.select\(\s*["'`]\*["'`]\s*\)/;

const files = {
  liveSessions: "app/api/admin/live-sessions/route.ts",
  createProfile: "app/api/admin/team/create-superadmin-profile/route.ts",
  reviewItem: "app/api/admin/team/review-item/route.ts",
  workSessions: "app/api/admin/team/work-sessions/route.ts",
  reviewModeration: "app/api/admin/reviews/[reviewId]/route.ts",
};

const source = Object.fromEntries(Object.entries(files).map(([name, file]) => [name, read(file)]));

const checks = {
  clusterAvoidsBroadSelect: Object.values(source).every((text) => !broadSelect.test(text)),
  liveSessionsUseNamedProjection: source.liveSessions.includes("LIVE_EVENT_FIELDS") && source.liveSessions.includes(".select(LIVE_EVENT_FIELDS)"),
  liveSessionsSanitizeBrowserMetadata: source.liveSessions.includes("sanitizeEventMetadata") && source.liveSessions.includes("events: safeEvents") && !source.liveSessions.includes("events: rawEvents"),
  liveSessionsMetadataIsBounded: source.liveSessions.includes("restaurant_id") && source.liveSessions.includes("restaurant_name") && source.liveSessions.includes("cleanText"),
  createProfileUsesNamedResponse: source.createProfile.includes("TEAM_PROFILE_RESPONSE_FIELDS") && source.createProfile.includes(".select(TEAM_PROFILE_RESPONSE_FIELDS)"),
  createProfileAuditDoesNotPersistFullRow: source.createProfile.includes("new_value: { team_type: data.team_type, status: data.status }") && !source.createProfile.includes("new_value: data"),
  reviewItemRequiresTeamManagement: source.reviewItem.includes("requireAdminApiRole(ADMIN_PAGE_ACCESS.teamManagement)"),
  reviewItemStrictlyAllowlistsActions: source.reviewItem.includes("REVIEW_ACTIONS") && source.reviewItem.includes("REVIEW_ACTIONS.has(action)"),
  reviewItemBoundsFreeText: source.reviewItem.includes("MAX_REVIEW_NOTES") && source.reviewItem.includes(".slice(0, MAX_REVIEW_NOTES)"),
  reviewItemAuditDoesNotPersistFullRow: source.reviewItem.includes("new_value: { status, reviewed_at: now }") && !source.reviewItem.includes("new_value: data"),
  workSessionsRequiresTeamManagement: source.workSessions.includes("requireAdminApiRole(ADMIN_PAGE_ACCESS.teamManagement)"),
  workSessionsStrictlyAllowlistsActions: source.workSessions.includes("WORK_SESSION_ACTIONS") && source.workSessions.includes("WORK_SESSION_ACTIONS.has(action)"),
  workSessionsBoundsFreeText: source.workSessions.includes("MAX_REVIEW_TEXT") && source.workSessions.includes(".slice(0, MAX_REVIEW_TEXT)"),
  workSessionsUseNamedResponse: source.workSessions.includes("WORK_SESSION_RESPONSE_FIELDS") && source.workSessions.includes(".select(WORK_SESSION_RESPONSE_FIELDS)"),
  reviewModerationBoundsNotes: source.reviewModeration.includes("MAX_MODERATION_NOTES") && source.reviewModeration.includes(".slice(0, MAX_MODERATION_NOTES)"),
  reviewModerationUsesNamedResponse: source.reviewModeration.includes("REVIEW_MODERATION_RESPONSE_FIELDS") && source.reviewModeration.includes(".select(REVIEW_MODERATION_RESPONSE_FIELDS)"),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ routes: Object.keys(files).length, checks, failed }, null, 2));
if (failed.length) process.exit(1);
