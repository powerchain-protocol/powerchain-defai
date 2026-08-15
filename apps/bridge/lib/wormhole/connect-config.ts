"use client";

import type { config } from "@wormhole-foundation/wormhole-connect";
import { nttExecutorRoute } from "@wormhole-foundation/wormhole-connect/ntt";

type JsonObject = Record<string, unknown>;

function object(value: unknown, code: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(code);
  return value as JsonObject;
}

/**
 * Browser-safe deployment configuration only. The JSON contains NTT deployment
 * identifiers and Connect metadata; route plugin functions are constructed here
 * and are never expected to be serialized into environment JSON.
 */
export function readPowerChainConnectConfig(): config.WormholeConnectConfig | null {
  const encoded = process.env.NEXT_PUBLIC_POWERCHAIN_NTT_CONNECT_CONFIG_JSON?.trim();
  if (!encoded) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(encoded); } catch { throw new Error("INVALID_WORMHOLE_NTT_CONFIG_JSON"); }
  const raw = object(parsed, "INVALID_WORMHOLE_NTT_CONFIG");
  const chains = raw.chains;
  if (!Array.isArray(chains) || !chains.includes("Solana") || !chains.includes("Sui")) throw new Error("WORMHOLE_CONNECT_CHAINS_REQUIRED");
  const ntt = object(raw.ntt, "WORMHOLE_NTT_DEPLOYMENT_REQUIRED");
  const nttTokens = object(ntt.tokens, "WORMHOLE_NTT_TOKENS_REQUIRED");
  if (Object.keys(nttTokens).length !== 1) throw new Error("POWERCHAIN_NTT_SINGLE_TOKEN_GROUP_REQUIRED");
  const deployments = Object.values(nttTokens)[0];
  if (!Array.isArray(deployments) || deployments.length < 2) throw new Error("POWERCHAIN_NTT_SOLANA_SUI_DEPLOYMENTS_REQUIRED");
  const deploymentChains = new Set(deployments.map((entry) => object(entry, "INVALID_NTT_DEPLOYMENT").chain));
  if (!deploymentChains.has("Solana") || !deploymentChains.has("Sui")) throw new Error("POWERCHAIN_NTT_SOLANA_SUI_DEPLOYMENTS_REQUIRED");
  for (const entry of deployments) {
    const d = object(entry, "INVALID_NTT_DEPLOYMENT");
    if (typeof d.manager !== "string" || !d.manager || typeof d.token !== "string" || !d.token) throw new Error("NTT_MANAGER_TOKEN_REQUIRED");
    if (!Array.isArray(d.transceiver) || d.transceiver.length === 0) throw new Error("NTT_TRANSCEIVER_REQUIRED");
  }
  const tokensConfig = object(raw.tokensConfig, "WORMHOLE_TOKENS_CONFIG_REQUIRED");
  if (Object.keys(tokensConfig).length < 2) throw new Error("PWRC_WPWRC_TOKEN_METADATA_REQUIRED");

  const { ntt: _ntt, routes: _routes, ...serializable } = raw;
  return {
    ...(serializable as config.WormholeConnectConfig),
    network: (raw.network === "Testnet" || raw.network === "Devnet" ? raw.network : "Mainnet") as config.WormholeConnectConfig["network"],
    chains: ["Solana", "Sui"],
    routes: [nttExecutorRoute({ ntt: ntt as never })],
    ui: {
      ...(object(raw.ui ?? {}, "INVALID_WORMHOLE_UI_CONFIG") as never),
      title: "PowerChain Bridge",
      disableUserInputtedTokens: true,
    },
  };
}
