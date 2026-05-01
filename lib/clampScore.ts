export function clampScore(score: any) {
  const num = Number(score || 0);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(Math.round(num), 100));
}