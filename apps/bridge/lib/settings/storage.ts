/** @powerchain-isomorphic-browser-guard Browser globals are accessed only behind explicit runtime guards. */
import { clampSwapSlippageBps } from "@powerchain/swap-core";
import { DEFAULT_JUPITER_SWAP_API, DEFAULT_USER_SETTINGS, EMPTY_SESSION_SECRETS } from "./defaults";
import type { BridgeDirection, PowerChainUserSettings, PreferredCurrency, SwapChain, UserSessionSecrets } from "@/types/user-settings";

export const SETTINGS_STORAGE_KEY = "powerchain.user-settings.v2";
export const SESSION_SECRETS_KEY = "powerchain.user-secrets.session.v1";
const LEGACY_TRANSACTION_PREFERENCES_KEY = "powerchain.transaction-preferences.v1";
const LEGACY_SLIPPAGE_KEY = "powerchain.swap.slippage-bps.v1";

const CURRENCIES = new Set<PreferredCurrency>(["USD", "EUR", "GBP", "KRW"]);
const SWAP_CHAINS = new Set<SwapChain>(["SOLANA", "SUI"]);
const BRIDGE_DIRECTIONS = new Set<BridgeDirection>(["SUI_TO_SOLANA", "SOLANA_TO_SUI"]);
const DISPLAY_NAME_MAX = 48;
const ENDPOINT_MAX = 2048;
const POWERCHAIN_API_KEY_MAX = 256;
const JUPITER_API_KEY_MAX = 512;

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function string(value: unknown, fallback = "", max = ENDPOINT_MAX) { return typeof value === "string" ? value.trim().slice(0, max) : fallback; }
function bool(value: unknown, fallback: boolean) { return typeof value === "boolean" ? value : fallback; }
function boundedNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, Math.round(parsed))) : fallback;
}

export function normalizeHttpEndpoint(value: string, options: { allowEmpty?: boolean; allowLocalDevelopment?: boolean } = {}): string {
  const trimmed = value.trim();
  if (!trimmed && options.allowEmpty) return "";
  if (!trimmed || trimmed.length > ENDPOINT_MAX) throw new Error("ENDPOINT_URL_INVALID");
  let url: URL;
  try { url = new URL(trimmed); } catch { throw new Error("ENDPOINT_URL_INVALID"); }
  if (url.username || url.password || url.search || url.hash) throw new Error("ENDPOINT_URL_UNSAFE");
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname.toLowerCase());
  if (url.protocol !== "https:" && !(options.allowLocalDevelopment && local && url.protocol === "http:")) throw new Error("ENDPOINT_HTTPS_REQUIRED");
  return url.toString().replace(/\/$/, "");
}

export function sanitizeSettings(value: unknown): PowerChainUserSettings {
  const root = record(value) ?? {};
  const profile = record(root.profile) ?? {};
  const connectivity = record(root.connectivity) ?? {};
  const jupiter = record(root.jupiter) ?? {};
  const swap = record(root.swap) ?? {};
  const bridge = record(root.bridge) ?? {};
  const preferredCurrency = CURRENCIES.has(profile.preferredCurrency as PreferredCurrency) ? profile.preferredCurrency as PreferredCurrency : DEFAULT_USER_SETTINGS.profile.preferredCurrency;
  const defaultChain = SWAP_CHAINS.has(swap.defaultChain as SwapChain) ? swap.defaultChain as SwapChain : DEFAULT_USER_SETTINGS.swap.defaultChain;
  const defaultDirection = BRIDGE_DIRECTIONS.has(bridge.defaultDirection as BridgeDirection) ? bridge.defaultDirection as BridgeDirection : DEFAULT_USER_SETTINGS.bridge.defaultDirection;
  const jupiterBase = string(jupiter.apiBaseUrl, DEFAULT_JUPITER_SWAP_API);
  return {
    version: 2,
    profile: { displayName: string(profile.displayName, "", DISPLAY_NAME_MAX), preferredCurrency },
    connectivity: {
      useCustomApi: bool(connectivity.useCustomApi, false),
      apiBaseUrl: string(connectivity.apiBaseUrl),
      useCustomSolanaRpc: bool(connectivity.useCustomSolanaRpc, false),
      solanaRpcUrl: string(connectivity.solanaRpcUrl),
      useCustomSuiRpc: bool(connectivity.useCustomSuiRpc, false),
      suiRpcUrl: string(connectivity.suiRpcUrl),
    },
    jupiter: { useCustomCredentials: bool(jupiter.useCustomCredentials, false), apiBaseUrl: jupiterBase || DEFAULT_JUPITER_SWAP_API },
    swap: {
      defaultChain,
      slippageBps: clampSwapSlippageBps(Number(swap.slippageBps ?? DEFAULT_USER_SETTINGS.swap.slippageBps)),
      mevProtection: bool(swap.mevProtection, true),
      showAdvancedRouting: bool(swap.showAdvancedRouting, false),
    },
    bridge: {
      defaultDirection,
      statusPollMs: boundedNumber(bridge.statusPollMs, DEFAULT_USER_SETTINGS.bridge.statusPollMs, 2_000, 30_000),
      preferRealtime: bool(bridge.preferRealtime, true),
    },
  };
}

export function sanitizeSessionSecrets(value: unknown): UserSessionSecrets {
  const root = record(value) ?? {};
  return {
    powerChainApiKey: string(root.powerChainApiKey, "", POWERCHAIN_API_KEY_MAX),
    jupiterApiKey: string(root.jupiterApiKey, "", JUPITER_API_KEY_MAX),
  };
}

function migrateLegacySettings(): PowerChainUserSettings | null {
  try {
    const preferencesRaw = window.localStorage.getItem(LEGACY_TRANSACTION_PREFERENCES_KEY);
    const slippageRaw = window.localStorage.getItem(LEGACY_SLIPPAGE_KEY);
    if (!preferencesRaw && !slippageRaw) return null;

    const preferences = preferencesRaw ? record(JSON.parse(preferencesRaw)) ?? {} : {};
    const migrated = sanitizeSettings({
      ...DEFAULT_USER_SETTINGS,
      swap: {
        ...DEFAULT_USER_SETTINGS.swap,
        defaultChain: preferences.defaultSwapChain ?? preferences.defaultChain,
        showAdvancedRouting: preferences.showAdvancedRouting,
        slippageBps: slippageRaw ? Number(slippageRaw) : DEFAULT_USER_SETTINGS.swap.slippageBps,
      },
    });
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(migrated));
      window.localStorage.removeItem(LEGACY_TRANSACTION_PREFERENCES_KEY);
      window.localStorage.removeItem(LEGACY_SLIPPAGE_KEY);
    } catch {
      // Storage may be read-only or quota-constrained; the in-memory migration is still safe to use.
    }
    return migrated;
  } catch {
    return null;
  }
}

export function readStoredSettings(): PowerChainUserSettings {
  if (typeof window === "undefined") return DEFAULT_USER_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return sanitizeSettings(JSON.parse(raw));
    return migrateLegacySettings() ?? DEFAULT_USER_SETTINGS;
  } catch { return DEFAULT_USER_SETTINGS; }
}

export function writeStoredSettings(settings: PowerChainUserSettings): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeSettings(settings))); } catch { /* storage is optional */ }
}

export function clearStoredSettings(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_TRANSACTION_PREFERENCES_KEY);
    window.localStorage.removeItem(LEGACY_SLIPPAGE_KEY);
  } catch { /* storage is optional */ }
}

export function readSessionSecrets(): UserSessionSecrets {
  if (typeof window === "undefined") return EMPTY_SESSION_SECRETS;
  try {
    const raw = window.sessionStorage.getItem(SESSION_SECRETS_KEY);
    return raw ? sanitizeSessionSecrets(JSON.parse(raw)) : EMPTY_SESSION_SECRETS;
  } catch { return EMPTY_SESSION_SECRETS; }
}

export function writeSessionSecrets(secrets: UserSessionSecrets): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(SESSION_SECRETS_KEY, JSON.stringify(sanitizeSessionSecrets(secrets))); } catch { /* session storage is optional */ }
}

export function clearSessionSecrets(): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(SESSION_SECRETS_KEY); } catch { /* session storage is optional */ }
}

export function exportSettings(settings: PowerChainUserSettings): string {
  return JSON.stringify({ kind: "powerchain-user-settings", exportedAt: new Date().toISOString(), settings: sanitizeSettings(settings), secretsIncluded: false }, null, 2);
}

export function importSettings(json: string): PowerChainUserSettings {
  if (json.length > 64_000) throw new Error("SETTINGS_IMPORT_TOO_LARGE");
  let parsed: unknown;
  try { parsed = JSON.parse(json); } catch { throw new Error("SETTINGS_IMPORT_INVALID_JSON"); }
  const root = record(parsed);
  if (!root) throw new Error("SETTINGS_IMPORT_INVALID");
  const source = root.kind === "powerchain-user-settings" ? root.settings : parsed;
  return sanitizeSettings(source);
}
