export type PreferredCurrency = "USD" | "EUR" | "GBP" | "KRW";
export type SwapChain = "SOLANA" | "SUI";
export type BridgeDirection = "SUI_TO_SOLANA" | "SOLANA_TO_SUI";

export type UserProfileSettings = Readonly<{
  displayName: string;
  preferredCurrency: PreferredCurrency;
}>;

export type ConnectivitySettings = Readonly<{
  useCustomApi: boolean;
  apiBaseUrl: string;
  useCustomSolanaRpc: boolean;
  solanaRpcUrl: string;
  useCustomSuiRpc: boolean;
  suiRpcUrl: string;
}>;

export type JupiterSettings = Readonly<{
  useCustomCredentials: boolean;
  apiBaseUrl: string;
}>;

export type SwapUserSettings = Readonly<{
  defaultChain: SwapChain;
  slippageBps: number;
  mevProtection: boolean;
  showAdvancedRouting: boolean;
}>;

export type BridgeUserSettings = Readonly<{
  defaultDirection: BridgeDirection;
  statusPollMs: number;
  preferRealtime: boolean;
}>;

export type PowerChainUserSettings = Readonly<{
  version: 2;
  profile: UserProfileSettings;
  connectivity: ConnectivitySettings;
  jupiter: JupiterSettings;
  swap: SwapUserSettings;
  bridge: BridgeUserSettings;
}>;

export type UserSessionSecrets = Readonly<{
  powerChainApiKey: string;
  jupiterApiKey: string;
}>;
