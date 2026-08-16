import { DEFAULT_BRIDGE_DIRECTION as PROTOCOL_DEFAULT_BRIDGE_DIRECTION } from "@powerchain/protocol";
import { crossChainPair, parseCrossChainDirection, type BlockchainChain, type CrossChainDirection } from "@powerchain/blockchain";

export type BridgeChain = BlockchainChain;
export type BridgeDirection = CrossChainDirection;

export type CanonicalBridgeRoute = {
  direction: BridgeDirection;
  sourceChain: BridgeChain;
  destinationChain: BridgeChain;
  sourceAsset: "PWRC" | "wPWRC";
  destinationAsset: "PWRC" | "wPWRC";
};

export const DEFAULT_BRIDGE_DIRECTION: BridgeDirection = PROTOCOL_DEFAULT_BRIDGE_DIRECTION;

const ROUTES: Record<BridgeDirection, CanonicalBridgeRoute> = {
  SOLANA_TO_SUI: {
    direction: "SOLANA_TO_SUI",
    sourceChain: "SOLANA",
    destinationChain: "SUI",
    sourceAsset: "PWRC",
    destinationAsset: "wPWRC",
  },
  SUI_TO_SOLANA: {
    direction: "SUI_TO_SOLANA",
    sourceChain: "SUI",
    destinationChain: "SOLANA",
    sourceAsset: "wPWRC",
    destinationAsset: "PWRC",
  },
};

export function canonicalBridgeRoute(direction: BridgeDirection): CanonicalBridgeRoute {
  const route = ROUTES[direction];
  if (!route) throw new Error("UNSUPPORTED_BRIDGE_DIRECTION");
  return route;
}

export function canonicalBridgeRoutes(): readonly CanonicalBridgeRoute[] {
  return [ROUTES.SUI_TO_SOLANA, ROUTES.SOLANA_TO_SUI];
}

export function parseBridgeDirection(value: unknown): BridgeDirection { return parseCrossChainDirection(value); }

export function bridgeChainPair(direction: BridgeDirection) { return crossChainPair(direction); }
