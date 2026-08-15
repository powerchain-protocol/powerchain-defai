import { PublicKey } from "@solana/web3.js";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import type { BridgeChain, BridgeDirection } from "./types";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_REQUIRED`);
  return value;
}
function solanaAddress(name: string) { return new PublicKey(required(name)).toBase58(); }
function suiAddress(name: string) { return normalizeSuiAddress(required(name)); }

export function nttBridgeConfig() {
  const environment = process.env.POWERCHAIN_ENVIRONMENT?.trim().toLowerCase() === "production" ? "mainnet" : (process.env.POWERCHAIN_WORMHOLE_NETWORK?.trim().toLowerCase() === "mainnet" ? "mainnet" : "testnet");
  return {
    environment,
    wormholeScanBaseUrl: (process.env.POWERCHAIN_WORMHOLESCAN_API_URL?.trim() || (environment === "mainnet" ? "https://api.wormholescan.io/api/v1" : "https://api.testnet.wormholescan.io/api/v1")).replace(/\/$/, ""),
    solana: {
      chainId: 1,
      manager: solanaAddress("POWERCHAIN_NTT_SOLANA_MANAGER"),
      emitter: solanaAddress("POWERCHAIN_NTT_SOLANA_EMITTER"),
      token: solanaAddress("POWERCHAIN_PWRC_SOLANA_MINT"),
    },
    sui: {
      chainId: 21,
      manager: suiAddress("POWERCHAIN_NTT_SUI_MANAGER"),
      emitter: suiAddress("POWERCHAIN_NTT_SUI_EMITTER"),
      token: required("WPWRC_SUI_COIN_TYPE"),
    },
  } as const;
}
export function directionChains(direction: BridgeDirection): { source: BridgeChain; destination: BridgeChain } {
  return direction === "SOLANA_TO_SUI" ? { source: "SOLANA", destination: "SUI" } : { source: "SUI", destination: "SOLANA" };
}
