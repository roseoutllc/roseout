import "server-only";

import { getCredentialVaultRuntimeSnapshot, type CredentialVaultEnvironment } from "@/lib/aws/admin-credential-vault";

export const MICROSOFT_365_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "User.Read",
  "Mail.ReadWrite",
  "Mail.Send",
  "Calendars.ReadWrite",
  "Tasks.ReadWrite",
  "DeviceManagementManagedDevices.ReadWrite.All",
  "DeviceManagementConfiguration.ReadWrite.All",
  "DeviceManagementApps.Read.All",
  "DeviceManagementServiceConfig.ReadWrite.All",
] as const;

const TENANT_ENV_KEYS = ["M365_TENANT_ID", "MICROSOFT_TENANT_ID", "AZURE_TENANT_ID"] as const;
const CLIENT_ENV_KEYS = ["M365_CLIENT_ID", "MICROSOFT_CLIENT_ID", "AZURE_CLIENT_ID"] as const;

function resolveConsistentEnv(keys: readonly string[], label: string) {
  const configured = keys
    .map((key) => ({ key, value: process.env[key]?.trim() || "" }))
    .filter((entry) => entry.value);

  if (!configured.length) return "";
  const distinct = [...new Set(configured.map((entry) => entry.value))];
  if (distinct.length > 1) {
    throw new Error(`${label}_ENV_CONFLICT`);
  }
  return distinct[0];
}

function validateTenantId(value: string) {
  const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const dns = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
  if (!guid.test(value) && !dns.test(value)) {
    throw new Error("M365_TENANT_ID_INVALID");
  }
  return value;
}

function environmentName(): CredentialVaultEnvironment {
  return process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production" ? "staging" : "production";
}

async function getVaultMicrosoftIdentity() {
  try {
    const snapshot = await getCredentialVaultRuntimeSnapshot(environmentName());
    const microsoft = snapshot.providers.microsoft;
    return {
      tenantId: String(microsoft?.tenantId || "").trim(),
      clientId: String(microsoft?.clientId || "").trim(),
    };
  } catch {
    return { tenantId: "", clientId: "" };
  }
}

export async function getMicrosoft365Config() {
  const vault = await getVaultMicrosoftIdentity();
  const tenantId = vault.tenantId || resolveConsistentEnv(TENANT_ENV_KEYS, "M365_TENANT");
  const clientId = vault.clientId || resolveConsistentEnv(CLIENT_ENV_KEYS, "M365_CLIENT");
  const appUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "https://theouthaven.com").replace(/\/$/, "");
  const redirectUri = process.env.M365_REDIRECT_URI?.trim() || `${appUrl}/api/admin/integrations/microsoft-365/callback`;
  if (!tenantId || !clientId) throw new Error("M365_NOT_CONFIGURED");
  validateTenantId(tenantId);
  return {
    tenantId,
    clientId,
    redirectUri,
    authorizeUrl: `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/authorize`,
    scopes: [...MICROSOFT_365_SCOPES],
  };
}
