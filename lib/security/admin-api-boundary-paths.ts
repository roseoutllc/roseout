const SESSION_BOUNDARY_PATTERNS: readonly RegExp[] = [
  /^\/api\/admin\/beta(?:\/|$)/,
  /^\/api\/admin\/campaigns(?:\/|$)/,
  /^\/api\/admin\/crm\/sms(?:\/|$)/,
  /^\/api\/admin\/demo\/theouthaven-lounge(?:\/|$)/,
  /^\/api\/admin\/engagement$/,
  /^\/api\/admin\/import-logs$/,
  /^\/api\/admin\/invites$/,
  /^\/api\/admin\/knowledge-base\/feedback$/,
  /^\/api\/admin\/locations\/search$/,
  /^\/api\/admin\/locations\/[^/]+\/summary$/,
  /^\/api\/admin\/locations\/[^/]+\/photos\/upload$/,
  /^\/api\/admin\/marketing\/audience$/,
  /^\/api\/admin\/marketing\/campaigns(?:\/|$)/,
  /^\/api\/admin\/marketing\/email\/send$/,
  /^\/api\/admin\/marketing\/settings$/,
  /^\/api\/admin\/marketing\/sms\/send$/,
  /^\/api\/admin\/marketing\/social\/generate$/,
  /^\/api\/admin\/recalculate-scores$/,
  /^\/api\/admin\/settings\/(?:ai-tag-helper|domain-benefit|google-places-budget|search-limits)$/,
];

export function requiresAdminApiSession(pathname: string) {
  return SESSION_BOUNDARY_PATTERNS.some((pattern) => pattern.test(pathname));
}
