import "server-only";

import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type RateLimitVerdict = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitVerdict> {
  const safeLimit = Math.max(1, Math.floor(limit));
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  const storageKey = createHash("sha256").update(key).digest("hex");

  const { data, error } = await supabaseAdmin.rpc("consume_api_rate_limit", {
    p_key: storageKey,
    p_limit: safeLimit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("Distributed rate limiter unavailable", { error: error.message });
    return { ok: false, remaining: 0, retryAfterSeconds: Math.min(windowSeconds, 60) };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: Boolean(row?.allowed),
    remaining: Math.max(0, Number(row?.remaining ?? 0)),
    retryAfterSeconds: Math.max(1, Number(row?.retry_after_seconds ?? windowSeconds)),
  };
}
