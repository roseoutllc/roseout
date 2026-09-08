import "server-only";

import { createHmac } from "node:crypto";
import type { CredentialProviderId } from "@/lib/admin/credential-vault-catalog";

export type CredentialVaultEnvironment = "production" | "staging";
export type CredentialVaultProviderStatus = { provider: CredentialProviderId; environment: CredentialVaultEnvironment; configuredFields: string[]; updatedAt: string | null; versionId: string | null; status: "configured" | "not_configured" };
export type CredentialVaultSummary = { ok: boolean; providers: CredentialVaultProviderStatus[] };
export type CredentialVaultRuntimeSnapshot = { ok: boolean; environment: CredentialVaultEnvironment; providers: Partial<Record<CredentialProviderId, Record<string, string>>> };
export type CredentialVaultRuntimeSyncResult = { triggered: boolean; workflow: string; error?: string };

function getGatewayConfig() {
  const baseUrl = String(process.env.AWS_PLATFORM_JOB_GATEWAY_URL || "").trim().replace(/\/$/, "");
  const secret = String(process.env.AWS_PLATFORM_JOB_GATEWAY_SECRET || "").trim();
  if (!baseUrl || !secret) throw new Error("credential_vault_gateway_not_configured");
  if (!/^https:\/\//i.test(baseUrl)) throw new Error("credential_vault_gateway_requires_https");
  return { baseUrl, secret };
}

async function signedRequest<T>(method: "GET" | "PUT" | "DELETE" | "POST", path: string, body = ""): Promise<T> {
  const { baseUrl, secret } = getGatewayConfig();
  const timestamp = Date.now().toString();
  const signature = createHmac("sha256", secret).update([timestamp, method, path, body].join("\n")).digest("hex");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${baseUrl}${path}`, { method, cache: "no-store", signal: controller.signal, headers: { ...(body ? { "content-type": "application/json" } : {}), "x-toh-timestamp": timestamp, "x-toh-signature": signature }, ...(body ? { body } : {}) });
    const data = await response.json().catch(() => null) as T | { error?: string } | null;
    if (!response.ok) throw new Error((data as { error?: string } | null)?.error || `credential_vault_gateway_http_${response.status}`);
    return data as T;
  } finally { clearTimeout(timeout); }
}

export async function getCredentialVaultSummary(environment: CredentialVaultEnvironment) {
  return signedRequest<CredentialVaultSummary>("GET", `/v1/credentials?environment=${encodeURIComponent(environment)}`);
}
export async function getCredentialVaultRuntimeSnapshot(environment: CredentialVaultEnvironment) {
  return signedRequest<CredentialVaultRuntimeSnapshot>("GET", `/v1/credentials/runtime?environment=${encodeURIComponent(environment)}`);
}
export async function updateCredentialVaultProvider(input: { provider: CredentialProviderId; environment: CredentialVaultEnvironment; values: Record<string, string>; clearFields?: string[] }) {
  return signedRequest<{ ok: boolean; provider: CredentialProviderId; configuredFields: string[]; updatedAt: string | null; versionId: string | null }>("PUT", `/v1/credentials/${encodeURIComponent(input.provider)}`, JSON.stringify({ environment: input.environment, values: input.values, clearFields: input.clearFields || [] }));
}
export async function deleteCredentialVaultProvider(provider: CredentialProviderId, environment: CredentialVaultEnvironment) {
  return signedRequest<{ ok: boolean; provider: CredentialProviderId }>("DELETE", `/v1/credentials/${encodeURIComponent(provider)}?environment=${encodeURIComponent(environment)}`);
}
export async function testCredentialVaultProvider(provider: CredentialProviderId, environment: CredentialVaultEnvironment) {
  return signedRequest<{ ok: boolean; provider: CredentialProviderId; status: "healthy" | "configured"; detail: string }>("POST", `/v1/credentials/${encodeURIComponent(provider)}/test`, JSON.stringify({ environment }));
}

export async function requestCredentialVaultRuntimeSync(environment: CredentialVaultEnvironment): Promise<CredentialVaultRuntimeSyncResult> {
  const workflow = "aws-credential-vault-runtime-sync.yml";
  try {
    const snapshot = await getCredentialVaultRuntimeSnapshot(environment);
    const token = String(snapshot.providers.github?.token || process.env.GITHUB_TOKEN || "").trim();
    if (!token) return { triggered: false, workflow, error: "github_runtime_sync_token_not_configured" };

    const repository = String(process.env.CREDENTIAL_VAULT_SYNC_REPOSITORY || "DevSoft-Development/roseout").trim();
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
      return { triggered: false, workflow, error: "credential_vault_sync_repository_invalid" };
    }

    const response = await fetch(`https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`, {
      method: "POST",
      cache: "no-store",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "user-agent": "TheOutHaven-CredentialVault",
        "x-github-api-version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main", inputs: { environment } }),
    });
    if (!response.ok) {
      return { triggered: false, workflow, error: `github_runtime_sync_http_${response.status}` };
    }
    return { triggered: true, workflow };
  } catch (error) {
    return { triggered: false, workflow, error: error instanceof Error ? error.message : "credential_vault_runtime_sync_failed" };
  }
}
