import "server-only";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

function isIpLiteral(hostname: string) {
  const value = normalizeHostname(hostname).replace(/^\[|\]$/g, "");
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value) || value.includes(":");
}

export function assertAllowedHttpsUrl(rawUrl: string, allowedHosts: readonly string[]) {
  const parsed = new URL(rawUrl);
  const hostname = normalizeHostname(parsed.hostname);
  const allowed = allowedHosts.some((entry) => {
    const candidate = normalizeHostname(entry);
    return hostname === candidate || (candidate.startsWith(".") && hostname.endsWith(candidate));
  });

  if (
    parsed.protocol !== "https:" || parsed.username || parsed.password ||
    (parsed.port && parsed.port !== "443") || hostname === "localhost" ||
    hostname.endsWith(".localhost") || isIpLiteral(hostname) || !allowed
  ) throw new Error("Outbound URL is not allowed.");

  return parsed;
}

export async function fetchAllowedHttpsUrl(
  rawUrl: string,
  options: { allowedHosts: readonly string[]; headers?: HeadersInit; maxRedirects?: number; signal?: AbortSignal },
) {
  const maxRedirects = Math.max(0, Math.min(options.maxRedirects ?? 3, 5));
  let current = assertAllowedHttpsUrl(rawUrl, options.allowedHosts);
  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const response = await fetch(current, { redirect: "manual", headers: options.headers, signal: options.signal });
    if (!REDIRECT_STATUSES.has(response.status)) return response;
    if (redirectCount === maxRedirects) throw new Error("Too many outbound redirects.");
    const location = response.headers.get("location");
    if (!location) throw new Error("Outbound redirect is missing a location.");
    current = assertAllowedHttpsUrl(new URL(location, current).toString(), options.allowedHosts);
  }
  throw new Error("Outbound request failed.");
}

export async function readResponseWithLimit(response: Response, maxBytes: number) {
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maxBytes) throw new Error("Outbound response is too large.");
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("Outbound response is too large.");
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return merged;
}
