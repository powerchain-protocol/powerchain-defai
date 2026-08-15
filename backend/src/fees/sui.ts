import { SuiClient } from "@mysten/sui/client";
import type { ServiceFeeVerificationResult } from "./types";

function ownerAddress(owner: unknown): string | null {
  if (!owner || typeof owner !== "object") return null;
  if ("AddressOwner" in owner && typeof (owner as { AddressOwner?: unknown }).AddressOwner === "string") return (owner as { AddressOwner: string }).AddressOwner;
  return null;
}

export async function verifySuiServiceFee(input: {
  rpcUrls: readonly string[];
  digest: string;
  coinType: string;
  recipient: string;
  expectedBaseUnits: string;
}): Promise<ServiceFeeVerificationResult> {
  let lastError = "SERVICE_FEE_SUI_RPC_UNAVAILABLE";
  for (const url of input.rpcUrls.filter(Boolean)) {
    try {
      const client = new SuiClient({ url });
      const tx = await client.getTransactionBlock({
        digest: input.digest,
        options: { showEffects: true, showBalanceChanges: true },
      });
      const status = tx.effects?.status?.status;
      if (status !== "success") {
        return { verified: false, finalized: Boolean(tx.checkpoint), sourceTx: input.digest, expectedBaseUnits: input.expectedBaseUnits, recipient: input.recipient, errorCode: "SERVICE_FEE_SUI_TX_FAILED", evidence: { url, status } };
      }
      if (!tx.checkpoint) { lastError = "SERVICE_FEE_SUI_TX_NOT_CHECKPOINTED"; continue; }
      let credited = 0n;
      for (const change of tx.balanceChanges ?? []) {
        if (change.coinType !== input.coinType) continue;
        if (ownerAddress(change.owner) !== input.recipient) continue;
        const amount = BigInt(change.amount);
        if (amount > 0n) credited += amount;
      }
      const expected = BigInt(input.expectedBaseUnits);
      if (credited !== expected) {
        return { verified: false, finalized: true, sourceTx: input.digest, expectedBaseUnits: input.expectedBaseUnits, recipient: input.recipient, errorCode: "SERVICE_FEE_SUI_AMOUNT_MISMATCH", evidence: { url, checkpoint: tx.checkpoint, creditedBaseUnits: credited.toString(), coinType: input.coinType } };
      }
      return { verified: true, finalized: true, sourceTx: input.digest, expectedBaseUnits: input.expectedBaseUnits, recipient: input.recipient, evidence: { url, checkpoint: tx.checkpoint, creditedBaseUnits: credited.toString(), coinType: input.coinType } };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "SERVICE_FEE_SUI_RPC_ERROR";
    }
  }
  return { verified: false, finalized: false, sourceTx: input.digest, expectedBaseUnits: input.expectedBaseUnits, recipient: input.recipient, errorCode: lastError, evidence: {} };
}
