import { normalizeChainAddress, type BlockchainChain, type CrossChainDirection, crossChainPair } from "@powerchain/blockchain";

export const BRIDGE_INTENT_VERSION = 2 as const;
export const BRIDGE_INTENT_MAX_DESTINATION_BYTES = 128 as const;
export const BRIDGE_QUOTE_COMMITMENT_BYTES = 32 as const;
export const BRIDGE_DIRECTION_CODES = { SOLANA_TO_SUI: 0, SUI_TO_SOLANA: 1 } as const;

export type BridgeDirectionCode = (typeof BRIDGE_DIRECTION_CODES)[keyof typeof BRIDGE_DIRECTION_CODES];

export type BridgeIntentInput = {
  direction: CrossChainDirection;
  amountBaseUnits: bigint;
  destination: string;
  quoteCommitment: string;
};

export type CanonicalBridgeIntent = {
  version: typeof BRIDGE_INTENT_VERSION;
  direction: CrossChainDirection;
  directionCode: BridgeDirectionCode;
  destinationChain: BlockchainChain;
  destination: string;
  amountBaseUnits: bigint;
  quoteCommitment: string;
  quoteCommitmentBytes: Uint8Array;
};

export function bridgeDirectionCode(direction: CrossChainDirection): BridgeDirectionCode {
  return BRIDGE_DIRECTION_CODES[direction];
}

export function parseQuoteCommitment(value: string): { hex: string; bytes: Uint8Array } {
  const hex = value.trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(hex)) throw new Error("BRIDGE_QUOTE_COMMITMENT_MUST_BE_SHA256");
  if (/^0{64}$/.test(hex)) throw new Error("BRIDGE_QUOTE_COMMITMENT_ZERO_FORBIDDEN");
  const bytes = Uint8Array.from(hex.match(/../g)!.map((byte) => Number.parseInt(byte, 16)));
  return { hex, bytes };
}

export function canonicalBridgeAddresses(direction: CrossChainDirection, sourceAddress: string, destinationAddress: string) {
  const pair = crossChainPair(direction);
  return {
    sourceChain: pair.sourceChain,
    destinationChain: pair.destinationChain,
    sourceAddress: normalizeChainAddress(pair.sourceChain, sourceAddress),
    destinationAddress: normalizeChainAddress(pair.destinationChain, destinationAddress),
  } as const;
}

export function canonicalBridgeIntent(input: BridgeIntentInput): CanonicalBridgeIntent {
  if (input.amountBaseUnits <= 0n || input.amountBaseUnits > 18_446_744_073_709_551_615n) {
    throw new Error("BRIDGE_AMOUNT_BASE_UNITS_INVALID");
  }
  const pair = crossChainPair(input.direction);
  const destination = normalizeChainAddress(pair.destinationChain, input.destination);
  const destinationBytes = new TextEncoder().encode(destination).byteLength;
  if (destinationBytes === 0 || destinationBytes > BRIDGE_INTENT_MAX_DESTINATION_BYTES) {
    throw new Error("BRIDGE_DESTINATION_LENGTH_INVALID");
  }
  const commitment = parseQuoteCommitment(input.quoteCommitment);
  return {
    version: BRIDGE_INTENT_VERSION,
    direction: input.direction,
    directionCode: bridgeDirectionCode(input.direction),
    destinationChain: pair.destinationChain,
    destination,
    amountBaseUnits: input.amountBaseUnits,
    quoteCommitment: commitment.hex,
    quoteCommitmentBytes: commitment.bytes,
  };
}
