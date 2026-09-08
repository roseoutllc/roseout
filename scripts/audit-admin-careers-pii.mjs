import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const broadSelect = /\.select\(\s*["'`]\*["'`]\s*\)/;

const files = {
  applicationDetail: "app/api/admin/careers/applications/[id]/route.ts",
  applicationNotes: "app/api/admin/careers/applications/[id]/notes/route.ts",
  applicationScorecard: "app/api/admin/careers/applications/[id]/scorecard/route.ts",
  interviews: "app/api/admin/careers/interviews/route.ts",
  interviewDetail: "app/api/admin/careers/interviews/[id]/route.ts",
  offers: "app/api/admin/careers/offers/route.ts",
  offerDetail: "app/api/admin/careers/offers/[id]/route.ts",
  jobs: "app/api/admin/careers/jobs/route.ts",
  jobDetail: "app/api/admin/careers/jobs/[id]/route.ts",
  contentTests: "app/api/admin/careers/content-tests/route.ts",
  contentTestDetail: "app/api/admin/careers/content-tests/[id]/route.ts",
  talentPoolDetail: "app/api/admin/careers/talent-pool/[id]/route.ts",
  teamConversion: "app/api/admin/careers/team-conversion/route.ts",
};

const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const allSources = Object.values(source);

const checks = {
  careersDetailRoutesAvoidBroadSelect: allSources.every((text) => !broadSelect.test(text)),
  applicationPatchUsesExplicitAllowlist:
    source.applicationDetail.includes("ALLOWED_EDIT_FIELDS") &&
    source.applicationDetail.includes("Object.entries(body)") &&
    !source.applicationDetail.includes(".update(body)"),
  interviewWritesUseExplicitAllowlists:
    source.interviews.includes("ALLOWED_CREATE_FIELDS") &&
    source.interviewDetail.includes("ALLOWED_EDIT_FIELDS"),
  offerWritesUseExplicitAllowlists:
    source.offerDetail.includes("ALLOWED_EDIT_FIELDS") &&
    !source.offers.includes("...body") &&
    !source.offerDetail.includes(".update(body)"),
  remainingCareersRoutesAvoidBroadSelect:
    [source.jobs, source.jobDetail, source.contentTests, source.contentTestDetail, source.talentPoolDetail, source.teamConversion].every((text) => !broadSelect.test(text)),
  contentTestWritesUseExplicitAllowlists:
    source.contentTests.includes("ALLOWED_CREATE_FIELDS") &&
    source.contentTestDetail.includes("ALLOWED_EDIT_FIELDS") &&
    !source.contentTests.includes("...body") &&
    !source.contentTestDetail.includes(".update(body)"),
  talentPoolWritesUseExplicitAllowlist:
    source.talentPoolDetail.includes("ALLOWED_EDIT_FIELDS") &&
    !source.talentPoolDetail.includes(".update(body)"),
  teamConversionUsesExplicitAllowlist:
    source.teamConversion.includes("ALLOWED_CREATE_FIELDS") &&
    source.teamConversion.includes("Object.entries(body)") &&
    !source.teamConversion.includes("...body"),
  hiringMutationResponsesUseNamedFields:
    source.applicationNotes.includes("CAREER_NOTE_FIELDS") &&
    source.applicationScorecard.includes("SCORECARD_FIELDS") &&
    source.interviews.includes("INTERVIEW_FIELDS") &&
    source.interviewDetail.includes("INTERVIEW_FIELDS") &&
    source.offers.includes("OFFER_FIELDS") &&
    source.offerDetail.includes("OFFER_FIELDS") &&
    source.jobs.includes("JOB_FIELDS") &&
    source.jobDetail.includes("JOB_FIELDS") &&
    source.contentTests.includes("CONTENT_TEST_FIELDS") &&
    source.contentTestDetail.includes("CONTENT_TEST_FIELDS") &&
    source.talentPoolDetail.includes("TALENT_POOL_FIELDS") &&
    source.teamConversion.includes("CONVERSION_FIELDS"),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ checks, failed }, null, 2));
if (failed.length) process.exit(1);
