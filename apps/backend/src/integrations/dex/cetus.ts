import { fetchIntegrationJson, configuredUrl } from "../http";

export type CetusIntegrationStatus = {
  provider: "cetus";
  chain: "sui";
  enabled: boolean;
  apiConfigured: boolean;
  packageConfigured: boolean;
  ready: boolean;
};

function env(name: string) { return process.env[name]?.trim() || undefined; }

export function cetusIntegrationStatus(): CetusIntegrationStatus {
  const apiConfigured = Boolean(env("POWERCHAIN_CETUS_API_URL"));
  const packageConfigured = Boolean(env("POWERCHAIN_CETUS_PACKAGE_ID"));
  const enabled = env("NEXT_PUBLIC_CETUS_ENABLED") === "true";
  return { provider: "cetus", chain: "sui", enabled, apiConfigured, packageConfigured, ready: enabled && apiConfigured };
}

export async function fetchCetusData<T = unknown>(path = ""): Promise<T> {
  const status = cetusIntegrationStatus();
  if (!status.enabled) throw new Error("CETUS_DISABLED");
  const baseUrl = configuredUrl("POWERCHAIN_CETUS_API_URL");
  return fetchIntegrationJson(`${baseUrl}/${path.replace(/^\/+/, "")}`) as Promise<T>;
}
