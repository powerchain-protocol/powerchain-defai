"use client";

import type { config } from "@wormhole-foundation/wormhole-connect";
import { nttExecutorRoute } from "@wormhole-foundation/wormhole-connect/ntt";

type JsonObject = Record<string, unknown>;
type NttExecutorRouteConfig = Parameters<typeof nttExecutorRoute>[0];

function object(value: unknown, code: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(code);
  return value as JsonObject;
}

function sourceTokenKey(tokensConfig: JsonObject): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_POWERCHAIN_NTT_DEFAULT_TOKEN_KEY?.trim();
  if (explicit && tokensConfig[explicit]) return explicit;

  for (const [key, raw] of Object.entries(tokensConfig)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const token = raw as JsonObject;
    const symbol = typeof token.symbol === "string" ? token.symbol.toLowerCase() : "";
    const nativeChain = typeof token.nativeChain === "string" ? token.nativeChain : "";
    const tokenId = token.tokenId && typeof token.tokenId === "object" && !Array.isArray(token.tokenId) ? token.tokenId as JsonObject : null;
    const tokenChain = tokenId && typeof tokenId.chain === "string" ? tokenId.chain : "";
    if ((symbol === "wpwrc" || key.toLowerCase().includes("wpwrc")) && (nativeChain === "Sui" || tokenChain === "Sui")) return key;
  }
  return undefined;
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
  try {
    parsed = JSON.parse(encoded);
  } catch {
    throw new Error("INVALID_WORMHOLE_NTT_CONFIG_JSON");
  }

  const raw = object(parsed, "INVALID_WORMHOLE_NTT_CONFIG");
  const chains = raw.chains;
  if (!Array.isArray(chains) || !chains.includes("Solana") || !chains.includes("Sui")) {
    throw new Error("WORMHOLE_CONNECT_CHAINS_REQUIRED");
  }

  const ntt = object(raw.ntt, "WORMHOLE_NTT_DEPLOYMENT_REQUIRED");
  const nttTokens = object(ntt.tokens, "WORMHOLE_NTT_TOKENS_REQUIRED");
  if (Object.keys(nttTokens).length !== 1) throw new Error("POWERCHAIN_NTT_SINGLE_TOKEN_GROUP_REQUIRED");
  const deployments = Object.values(nttTokens)[0];
  if (!Array.isArray(deployments) || deployments.length < 2) throw new Error("POWERCHAIN_NTT_SOLANA_SUI_DEPLOYMENTS_REQUIRED");

  const deploymentChains = new Set(deployments.map((entry) => object(entry, "INVALID_NTT_DEPLOYMENT").chain));
  if (!deploymentChains.has("Solana") || !deploymentChains.has("Sui")) throw new Error("POWERCHAIN_NTT_SOLANA_SUI_DEPLOYMENTS_REQUIRED");
  for (const entry of deployments) {
    const deployment = object(entry, "INVALID_NTT_DEPLOYMENT");
    if (typeof deployment.manager !== "string" || !deployment.manager || typeof deployment.token !== "string" || !deployment.token) {
      throw new Error("NTT_MANAGER_TOKEN_REQUIRED");
    }
    if (!Array.isArray(deployment.transceiver) || deployment.transceiver.length === 0) throw new Error("NTT_TRANSCEIVER_REQUIRED");
  }

  const tokensConfig = object(raw.tokensConfig, "WORMHOLE_TOKENS_CONFIG_REQUIRED");
  if (Object.keys(tokensConfig).length < 2) throw new Error("PWRC_WPWRC_TOKEN_METADATA_REQUIRED");
  const defaultTokenKey = sourceTokenKey(tokensConfig);
  const rawUi = raw.ui && typeof raw.ui === "object" && !Array.isArray(raw.ui) ? raw.ui as JsonObject : {};
  const rawDefaults = rawUi.defaultInputs && typeof rawUi.defaultInputs === "object" && !Array.isArray(rawUi.defaultInputs)
    ? rawUi.defaultInputs as JsonObject
    : {};

  const { ntt: _ntt, routes: _routes, ui: _ui, ...serializable } = raw;
  const result = Object.assign({}, serializable, {
    network: raw.network === "Testnet" || raw.network === "Devnet" ? raw.network : "Mainnet",
    chains: ["Solana", "Sui"],
    routes: [nttExecutorRoute({ ntt } as unknown as NttExecutorRouteConfig)],
    ui: {
      ...rawUi,
      title: typeof rawUi.title === "string" && rawUi.title.trim() ? rawUi.title : "PowerChain Bridge",
      disableUserInputtedTokens: true,
      defaultInputs: {
        ...rawDefaults,
        fromChain: "Sui",
        toChain: "Solana",
        ...(defaultTokenKey ? { tokenKey: defaultTokenKey } : {}),
      },
    },
  });

  return result as unknown as config.WormholeConnectConfig;
}
