export type SecurityRuntimePolicy = {
  maxJsonBodyBytes: number;
  maxQueryValueLength: number;
  requireHttpsInProduction: boolean;
  trustForwardedHeaders: false;
  trustedPlatformIpHeaders: readonly ["x-vercel-forwarded-for", "cf-connecting-ip"];
  authoritativeForWalletIdentity: false;
  authoritativeForBridgeAccounting: false;
};

export const SECURITY_RUNTIME_POLICY: SecurityRuntimePolicy = {
  maxJsonBodyBytes: 64 * 1024,
  maxQueryValueLength: 512,
  requireHttpsInProduction: true,
  trustForwardedHeaders: false,
  trustedPlatformIpHeaders: ["x-vercel-forwarded-for", "cf-connecting-ip"],
  authoritativeForWalletIdentity: false,
  authoritativeForBridgeAccounting: false,
};

export function safeRequestId(value: string | null | undefined): string | null { if (!value) return null; const trimmed = value.trim(); return /^[A-Za-z0-9._:-]{8,128}$/.test(trimmed) ? trimmed : null; }
export function assertBoundedText(value: string, field: string, maxLength = SECURITY_RUNTIME_POLICY.maxQueryValueLength): string { const trimmed = value.trim(); if (!trimmed || trimmed.length > maxLength || /[\u0000-\u001F\u007F]/.test(trimmed)) throw new Error(`${field.toUpperCase()}_INVALID`); return trimmed; }
export function assertJsonContentLength(value: string | null): void { if (!value) return; if (!/^\d+$/.test(value)) throw new Error("CONTENT_LENGTH_INVALID"); if (Number(value) > SECURITY_RUNTIME_POLICY.maxJsonBodyBytes) throw new Error("REQUEST_BODY_TOO_LARGE"); }
export function sanitizePublicErrorCode(value: unknown): string { const code = value instanceof Error ? value.message : typeof value === "string" ? value : "UNKNOWN_ERROR"; return /^[A-Z0-9_:-]{2,96}$/.test(code) ? code : "REQUEST_FAILED"; }
export function publicSecurityPolicy() { return { maxJsonBodyBytes: SECURITY_RUNTIME_POLICY.maxJsonBodyBytes, maxQueryValueLength: SECURITY_RUNTIME_POLICY.maxQueryValueLength, requireHttpsInProduction: SECURITY_RUNTIME_POLICY.requireHttpsInProduction, trustForwardedHeaders: false as const, trustedPlatformIpHeaders: SECURITY_RUNTIME_POLICY.trustedPlatformIpHeaders, authoritativeForWalletIdentity: false as const, authoritativeForBridgeAccounting: false as const, apiKey: apiKeyPolicy() }; }


export type ApiKeyMode = "off" | "optional" | "required";
export const API_KEY_HEADER = "X-Api-Key" as const;
export const API_KEY_MIN_LENGTH = 24;
export const API_KEY_MAX_LENGTH = 256;

function parseApiKeyMode(value: string | undefined): ApiKeyMode {
  const normalized = value?.trim().toLowerCase();
  return normalized === "required" || normalized === "optional" || normalized === "off" ? normalized : "optional";
}

function configuredApiKeys(env: NodeJS.ProcessEnv = process.env): readonly string[] {
  return [env.POWERCHAIN_API_KEYS ?? "", env.SWAGGER_API_KEY ?? ""].join(",").split(",").map((value) => value.trim()).filter((value) => value.length >= API_KEY_MIN_LENGTH && value.length <= API_KEY_MAX_LENGTH);
}

function fixedWorkEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) diff |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  return diff === 0;
}

export function apiKeyPolicy(env: NodeJS.ProcessEnv = process.env) {
  const mode = parseApiKeyMode(env.POWERCHAIN_API_KEY_MODE);
  const keys = configuredApiKeys(env);
  return { mode, configured: keys.length > 0, headerName: API_KEY_HEADER } as const;
}

export function authorizeApiKey(value: string | null | undefined, env: NodeJS.ProcessEnv = process.env): { ok: true } | { ok: false; code: "API_KEY_REQUIRED" | "API_KEY_INVALID" | "API_KEY_NOT_CONFIGURED" } {
  const mode = parseApiKeyMode(env.POWERCHAIN_API_KEY_MODE);
  if (mode === "off") return { ok: true };
  const keys = configuredApiKeys(env);
  const provided = value?.trim() ?? "";
  if (provided.length > API_KEY_MAX_LENGTH) return { ok: false, code: "API_KEY_INVALID" };
  if (mode === "required" && keys.length === 0) return { ok: false, code: "API_KEY_NOT_CONFIGURED" };
  if (!provided) return mode === "required" ? { ok: false, code: "API_KEY_REQUIRED" } : { ok: true };
  return keys.some((key) => fixedWorkEqual(key, provided)) ? { ok: true } : { ok: false, code: "API_KEY_INVALID" };
}
