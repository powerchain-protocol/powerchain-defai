import type { CrossChainDirection } from "@powerchain/blockchain";
export type BridgeDirection = CrossChainDirection;
export type BridgeSettlementProtocol = "wormhole-ntt";
export type BridgeContractBoundary = { settlementProtocol: BridgeSettlementProtocol; auxiliaryProgramsMovePrincipal: false; userSignatureRequired: true };
