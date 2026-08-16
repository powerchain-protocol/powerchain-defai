import "server-only";

import { createHash } from "node:crypto";
import { canonicalBridgeAddresses } from "@powerchain/bridge-core";
import { parseNonNegativeBaseUnits, parsePositiveBaseUnits } from "../../lib/bridge/base-units";
import { canonicalBridgeRoute, parseBridgeDirection, type BridgeDirection } from "../../lib/bridge/route-contract";

export type BridgeIntentInput = {
  quoteId: string;
  direction: BridgeDirection;
  principalBaseUnits: string;
  serviceFeeBaseUnits: string;
  sourceAddress: string;
  destinationAddress: string;
  feeRecipient: string;
  runtimeSnapshotId: string;
  quoteExpiresAt: string;
};

function cleanIdentifier(value: unknown, field: string, max = 256) {
  if (typeof value !== "string") throw new Error(`INVALID_${field.toUpperCase()}`);
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > max || /[\u0000-\u001f\u007f]/.test(cleaned)) throw new Error(`INVALID_${field.toUpperCase()}`);
  return cleaned;
}

function canonicalJson(value: Record<string, string>) {
  return JSON.stringify(Object.keys(value).sort().reduce<Record<string, string>>((out, key) => {
    out[key] = value[key];
    return out;
  }, {}));
}

export function buildBridgeIntent(input: BridgeIntentInput) {
  const direction = parseBridgeDirection(input.direction);
  const route = canonicalBridgeRoute(direction);
  const addresses = canonicalBridgeAddresses(direction, input.sourceAddress, input.destinationAddress);
  const principal = parsePositiveBaseUnits(input.principalBaseUnits, "principalBaseUnits");
  const fee = parseNonNegativeBaseUnits(input.serviceFeeBaseUnits, "serviceFeeBaseUnits");
  const expiresAt = new Date(input.quoteExpiresAt);
  if (!Number.isFinite(expiresAt.getTime())) throw new Error("INVALID_QUOTE_EXPIRY");
  if (expiresAt.getTime() <= Date.now()) throw new Error("QUOTE_EXPIRED");

  const canonical = {
    direction,
    destinationAddress: addresses.destinationAddress,
    feeRecipient: cleanIdentifier(input.feeRecipient, "feeRecipient"),
    principalBaseUnits: principal.toString(),
    quoteExpiresAt: expiresAt.toISOString(),
    quoteId: cleanIdentifier(input.quoteId, "quoteId", 128),
    runtimeSnapshotId: cleanIdentifier(input.runtimeSnapshotId, "runtimeSnapshotId", 128),
    serviceFeeBaseUnits: fee.toString(),
    sourceAddress: addresses.sourceAddress,
  } as const;
  const commitment = createHash("sha256").update(canonicalJson(canonical)).digest("hex");
  return { ...canonical, route, commitment, totalSourceDebitBaseUnits: (principal + fee).toString() } as const;
}
