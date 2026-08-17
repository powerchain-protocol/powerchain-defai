import { POWERCHAIN_CANONICAL_SOLANA_MINT } from "@powerchain/protocol/token-information";

/** Compile-time placeholder only. Runtime verification always rejects it. */
export const SOLANA_STAKING_SOURCE_PLACEHOLDER_PROGRAM_ID = "Stake11111111111111111111111111111111111111" as const;
export const SOLANA_TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" as const;
export const SOLANA_STAKING_CONFIG_VERSION = 1 as const;
export const PWRC_STAKING_REWARD_MODEL = "fixed-pool" as const;
export const PWRC_STAKING_REWARD_MINT = POWERCHAIN_CANONICAL_SOLANA_MINT;

export const STAKING_RUNTIME_POLICY = Object.freeze({
  connectedWalletSigns: true,
  backendCustody: false,
  fabricatedAprAllowed: false,
  fabricatedRewardRateAllowed: false,
  runtimeVerificationRequired: true,
} as const);

export const STAKING_ENV = Object.freeze({
  solanaProgramId: "POWERCHAIN_SOLANA_STAKING_PROGRAM_ID",
  solanaConfig: "POWERCHAIN_SOLANA_STAKING_CONFIG",
  solanaStakeVault: "POWERCHAIN_SOLANA_STAKING_VAULT",
  solanaRewardVault: "POWERCHAIN_SOLANA_STAKING_REWARD_VAULT",
  solanaRpcUrl: "POWERCHAIN_SOLANA_RPC_URL",
  solanaRpcFallbackUrl: "POWERCHAIN_SOLANA_RPC_FALLBACK_URL",
  solanaRpcFallbackUrls: "POWERCHAIN_SOLANA_RPC_FALLBACK_URLS",
  suiPackageId: "POWERCHAIN_SUI_STAKING_PACKAGE_ID",
  suiPoolObjectId: "POWERCHAIN_SUI_STAKING_POOL_OBJECT_ID",
  suiRewardPoolObjectId: "POWERCHAIN_SUI_STAKING_REWARD_POOL_OBJECT_ID",
  suiCoinType: "POWERCHAIN_WPWRC_SUI_COIN_TYPE",
} as const);
