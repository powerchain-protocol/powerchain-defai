import { DEFAULT_SWAP_SLIPPAGE_BPS } from "@powerchain/swap-core";
import type { PowerChainUserSettings, UserSessionSecrets } from "@/types/user-settings";

export const DEFAULT_JUPITER_SWAP_API = "https://api.jup.ag/swap/v2";

export const DEFAULT_USER_SETTINGS: PowerChainUserSettings = Object.freeze({
  version: 3,
  profile: Object.freeze({ displayName: "", preferredCurrency: "USD" }),
  connectivity: Object.freeze({
    useCustomApi: false,
    apiBaseUrl: "",
    useCustomSolanaRpc: false,
    solanaRpcUrl: "",
    useCustomSuiRpc: false,
    suiRpcUrl: "",
  }),
  jupiter: Object.freeze({ useCustomCredentials: false, apiBaseUrl: DEFAULT_JUPITER_SWAP_API }),
  swap: Object.freeze({
    defaultChain: "SOLANA",
    slippageBps: DEFAULT_SWAP_SLIPPAGE_BPS,
    mevProtection: true,
    showAdvancedRouting: false,
  }),
  bridge: Object.freeze({
    defaultDirection: "SUI_TO_SOLANA",
    statusPollMs: 5_000,
    preferRealtime: true,
  }),
  operations: Object.freeze({ statusRefreshMs: 30_000, showProcessTelemetry: true }),
});

export const EMPTY_SESSION_SECRETS: UserSessionSecrets = Object.freeze({ powerChainApiKey: "", jupiterApiKey: "" });
