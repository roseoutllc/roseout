export const OUTINGS_PLANNED_BASELINE = 10000;

export function getLiveOutingsPlanned(searchCount?: number | null) {
  return OUTINGS_PLANNED_BASELINE + Math.max(0, searchCount || 0);
}
