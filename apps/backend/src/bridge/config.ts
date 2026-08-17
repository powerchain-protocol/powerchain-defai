import { PublicKey } from "@solana/web3.js";
import { crossChainPair, normalizeSuiAddress } from "@powerchain/blockchain";
import { DEFAULT_BRIDGE_DIRECTION, POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID } from "@powerchain/protocol";
import type { BridgeChain, BridgeDirection } from "./types";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_REQUIRED`);
  return value;
}

function optional(name: string) {
  return process.env[name]?.trim() || null;
}

function solanaAddress(name: string) {
  return new PublicKey(required(name)).toBase58();
}

function optionalSolanaAddress(name: string) {
  const value = optional(name);
  return value ? new PublicKey(value).toBase58() : null;
}

function suiAddress(name: string) {
  return normalizeSuiAddress(required(name));
}

function optionalSuiAddress(name: string) {
  const value = optional(name);
  return value ? normalizeSuiAddress(value) : null;
}

export function configuredBridgeDirection(): BridgeDirection {
  const value = process.env.POWERCHAIN_DEFAULT_BRIDGE_DIRECTION?.trim().toUpperCase();
  if (!value) return DEFAULT_BRIDGE_DIRECTION;
  if (value === "SOLANA_TO_SUI" || value === "SUI_TO_SOLANA") return value;
  throw new Error("POWERCHAIN_DEFAULT_BRIDGE_DIRECTION_INVALID");
}

export function auxiliaryBridgeConfig() {
  const configuredProgram = process.env.POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID?.trim();
  if (configuredProgram && new PublicKey(configuredProgram).toBase58() !== POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID) {
    throw new Error("POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID_MISMATCH");
  }

  return {
    solana: {
      programId: POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID,
      authority: optionalSolanaAddress("POWERCHAIN_SOLANA_BRIDGE_AUTHORITY"),
    },
    sui: {
      packageId: optionalSuiAddress("POWERCHAIN_SUI_BRIDGE_PACKAGE_ID"),
      authority: optionalSuiAddress("POWERCHAIN_SUI_BRIDGE_AUTHORITY"),
    },
  } as const;
}

export function nttBridgeConfig() {
  const environment = process.env.POWERCHAIN_ENVIRONMENT?.trim().toLowerCase() === "production"
    ? "mainnet"
    : process.env.POWERCHAIN_WORMHOLE_NETWORK?.trim().toLowerCase() === "mainnet" ? "mainnet" : "testnet";

  return {
    environment,
    defaultDirection: configuredBridgeDirection(),
    wormholeScanBaseUrl: (
      process.env.POWERCHAIN_WORMHOLESCAN_API_URL?.trim()
      || (environment === "mainnet" ? "https://api.wormholescan.io/api/v1" : "https://api.testnet.wormholescan.io/api/v1")
    ).replace(/\/$/, ""),
    auxiliary: auxiliaryBridgeConfig(),
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
  const pair = crossChainPair(direction);
  return { source: pair.sourceChain, destination: pair.destinationChain };
}
