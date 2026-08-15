export type BridgeChain = "SOLANA" | "SUI";
export type BridgeDirection = "SOLANA_TO_SUI" | "SUI_TO_SOLANA";

export type CanonicalBridgeRoute = {
  direction: BridgeDirection;
  sourceChain: BridgeChain;
  destinationChain: BridgeChain;
  sourceAsset: "PWRC" | "wPWRC";
  destinationAsset: "PWRC" | "wPWRC";
};

const ROUTES: Record<BridgeDirection, CanonicalBridgeRoute> = {
  SOLANA_TO_SUI: { direction: "SOLANA_TO_SUI", sourceChain: "SOLANA", destinationChain: "SUI", sourceAsset: "PWRC", destinationAsset: "wPWRC" },
  SUI_TO_SOLANA: { direction: "SUI_TO_SOLANA", sourceChain: "SUI", destinationChain: "SOLANA", sourceAsset: "wPWRC", destinationAsset: "PWRC" },
};

export function canonicalBridgeRoute(direction: BridgeDirection): CanonicalBridgeRoute {
  const route = ROUTES[direction];
  if (!route) throw new Error("UNSUPPORTED_BRIDGE_DIRECTION");
  return route;
}

export function parseBridgeDirection(value: unknown): BridgeDirection {
  if (value === "SOLANA_TO_SUI" || value === "SUI_TO_SOLANA") return value;
  throw new Error("UNSUPPORTED_BRIDGE_DIRECTION");
}
