import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const broadSelect = /\.select\(\s*["'`]\*["'`]\s*\)/;

const bugs = read("app/api/admin/beta/bugs/route.ts");
const feedback = read("app/api/admin/beta/feedback/route.ts");
const tasks = read("app/api/admin/beta/tasks/route.ts");

const checks = {
  betaReviewRoutesAvoidBroadSelect: [bugs, feedback, tasks].every((text) => !broadSelect.test(text)),
  bugReviewUsesBoundedPatch: bugs.includes("BUG_FIELDS") && bugs.includes("BUG_STATUSES") && !bugs.includes(".update(body)"),
  feedbackReviewUsesBoundedPatch: feedback.includes("FEEDBACK_FIELDS") && feedback.includes("FEEDBACK_STATUSES") && !feedback.includes(".update(body)"),
  taskUpdatesUseExplicitAllowlist:
    tasks.includes("TASK_FIELDS") &&
    tasks.includes("ALLOWED_UPDATE_FIELDS") &&
    tasks.includes("Object.entries(body)") &&
    !tasks.includes("const {id,...updates}=b") &&
    !tasks.includes(".update(body)"),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ checks, failed }, null, 2));
if (failed.length) process.exit(1);
