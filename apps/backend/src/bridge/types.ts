export type BridgeChain = "SOLANA" | "SUI";
export type BridgeDirection = "SOLANA_TO_SUI" | "SUI_TO_SOLANA";

export type VerifiedChainTransaction = {
  chain: BridgeChain;
  txHash: string;
  finalized: true;
  success: true;
  sender: string;
  manager: string;
  principalDeltaBaseUnits: string;
  evidence: Record<string, unknown>;
};

export type WormholeNttObservation = {
  operationId: string;
  emitterChain: number;
  emitterAddress: string;
  sequence: string;
  sourceTx: string;
  destinationTx: string | null;
  vaaRaw: string | null;
  fromChain: number;
  toChain: number;
  fromAddress: string;
  toAddress: string;
  normalizedAmountBaseUnits: string;
  sourceStatus: string | null;
  destinationStatus: string | null;
};
