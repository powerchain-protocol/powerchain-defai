import "server-only";

import { POWERCHAIN_INFORMATION_COMMITMENT, serverProtocolAddresses, DEFAULT_BRIDGE_DIRECTION, POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID } from "@powerchain/protocol";
import { auxiliaryBridgeOperations } from "@powerchain/backend";
import { canonicalBridgeRoutes } from "../../lib/bridge/route-contract";
import { solanaRpcUrls, solanaWebSocketUrls } from "@powerchain/backend/services/rpc";

function values(...raw: Array<string | undefined>) {
  const result: string[] = [];
  for (const value of raw) {
    for (const item of (value ?? "").split(",").map((entry) => entry.trim()).filter(Boolean)) {
      if (!result.includes(item)) result.push(item);
    }
  }
  return result;
}

function routeId(direction: "SOLANA_TO_SUI" | "SUI_TO_SOLANA") {
  return direction === "SOLANA_TO_SUI"
    ? process.env.POWERCHAIN_ROUTE_SOLANA_TO_SUI_ID?.trim() || "powerchain-solana-to-sui"
    : process.env.POWERCHAIN_ROUTE_SUI_TO_SOLANA_ID?.trim() || "powerchain-sui-to-solana";
}

export function publicBridgeConfiguration() {
  const addresses = serverProtocolAddresses();
  const operations = auxiliaryBridgeOperations();
  const defaultDirectionRaw = process.env.POWERCHAIN_DEFAULT_BRIDGE_DIRECTION?.trim().toUpperCase();
  const defaultDirection = defaultDirectionRaw === "SOLANA_TO_SUI" || defaultDirectionRaw === "SUI_TO_SOLANA"
    ? defaultDirectionRaw
    : DEFAULT_BRIDGE_DIRECTION;

  const explicitSolanaRpcEndpoints = values(
    process.env.POWERCHAIN_SOLANA_RPC_URL,
    process.env.POWERCHAIN_SOLANA_RPC_FALLBACK_URL,
    process.env.POWERCHAIN_SOLANA_RPC_FALLBACK_URLS,
  );
  const explicitSolanaWsEndpoints = values(
    process.env.POWERCHAIN_SOLANA_WS_URL,
    process.env.POWERCHAIN_SOLANA_WS_FALLBACK_URL,
    process.env.POWERCHAIN_SOLANA_WS_FALLBACK_URLS,
  );
  const configuredSolanaRpcEndpoints = Array.from(new Set([...explicitSolanaRpcEndpoints, ...solanaRpcUrls()]));
  const solanaWsEndpoints = Array.from(new Set([...explicitSolanaWsEndpoints, ...solanaWebSocketUrls()]));
  const suiGrpcEndpoints = values(
    process.env.POWERCHAIN_SUI_GRPC_URL,
    process.env.POWERCHAIN_SUI_GRPC_FALLBACK_URL,
    process.env.POWERCHAIN_SUI_GRPC_FALLBACK_URLS,
  );
  const appRealtimeEndpoints = values(
    process.env.NEXT_PUBLIC_POWERCHAIN_REALTIME_WS_URL,
    process.env.NEXT_PUBLIC_POWERCHAIN_REALTIME_WS_FALLBACK_URL,
    process.env.NEXT_PUBLIC_POWERCHAIN_REALTIME_WS_FALLBACK_URLS,
  );

  return {
    version: "1.0.0",
    defaultDirection,
    defaultRoute: {
      sourceChain: "SUI",
      sourceAsset: "wPWRC",
      destinationChain: "SOLANA",
      destinationAsset: "PWRC",
    },
    principalRule: "1:1",
    informationCommitment: POWERCHAIN_INFORMATION_COMMITMENT,
    protocol: {
      provider: "Wormhole",
      transferProtocol: "NTT",
      auxiliaryContractsMovePrincipal: false,
    },
    contracts: {
      solana: {
        programId: POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID,
        authority: addresses.solanaBridgeAuthority || null,
      },
      sui: {
        packageId: addresses.suiBridgePackageId || null,
        authority: addresses.suiBridgeAuthority || null,
        configObjectId: addresses.suiBridgeConfigObjectId || null,
      },
    },
    operations,
    assets: {
      pwrcSolanaMint: addresses.pwrcSolanaMint || null,
      wpwrcSuiCoinType: addresses.wpwrcSuiCoinType || null,
    },
    ntt: {
      solanaManager: addresses.wormholeSolanaManager || null,
      solanaTransceiver: addresses.wormholeSolanaTransceiver || null,
      suiManager: addresses.wormholeSuiManager || null,
      suiTransceiver: addresses.wormholeSuiTransceiver || null,
    },
    routes: canonicalBridgeRoutes().map((route) => ({ ...route, routeId: routeId(route.direction), default: route.direction === defaultDirection })),
    connectivity: {
      solanaRpcEndpoints: configuredSolanaRpcEndpoints.length,
      solanaWebSocketEndpoints: solanaWsEndpoints.length,
      suiGrpcEndpoints: suiGrpcEndpoints.length,
      appRealtimeWebSocketEndpoints: appRealtimeEndpoints.length,
      sseFallback: "/api/v1/bridge/transfers/:id/events/stream",
      pollingFallback: "/api/v1/bridge/transfers/:id/events",
    },
  } as const;
}
