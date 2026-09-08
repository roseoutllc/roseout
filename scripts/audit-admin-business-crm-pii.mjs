import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const broadSelect = /\.select\(\s*["'`]\*["'`]\s*\)/;

const files = {
  business: "app/api/admin/businesses/[id]/route.ts",
  notes: "app/api/admin/businesses/[id]/notes/route.ts",
  outreach: "app/api/admin/businesses/[id]/outreach/route.ts",
  health: "app/api/admin/crm/location-health/route.ts",
  enhancement: "app/api/admin/crm/location-enhancement/route.ts",
};

const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const checks = {
  clusterAvoidsBroadSelect: Object.values(source).every((text) => !broadSelect.test(text)),
  businessUsesNamedLocationAndCrmFields: source.business.includes("LOCATION_FIELDS") && source.business.includes("CRM_FIELDS"),
  businessPatchUsesExplicitEditableFields: source.business.includes("EDITABLE_FIELDS") && !source.business.includes("...body"),
  notesUseProductionNoteBodyColumn:
    source.notes.includes("note_body: noteBody") &&
    !/\.insert\(\s*\{[\s\S]*?\bnote\s*:/m.test(source.notes),
  notesRecordActor: source.notes.includes("actor_user_id: auth.adminUser?.user_id"),
  outreachUsesCanonicalLocationFields: source.outreach.includes('.from("locations")') && !source.outreach.includes("business_outreach"),
  outreachBoundsNotes: source.outreach.includes("slice(0, 5000)"),
  healthUsesNamedRunProjection: source.health.includes("ENRICHMENT_RUN_FIELDS") && source.health.includes(".select(ENRICHMENT_RUN_FIELDS)"),
  healthDoesNotReturnRunSettings: source.health.includes("settings: _settings"),
  enhancementUsesNamedExistingAndResponseFields: source.enhancement.includes("existingFields.join") && source.enhancement.includes("responseFields.join"),
  enhancementSkipsMissingActivitiesTimestamp: source.enhancement.includes('table !== "activities"'),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ checks, failed }, null, 2));
if (failed.length) process.exit(1);
