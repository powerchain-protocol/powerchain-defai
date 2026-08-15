import { createPowerChainSuiClient } from "../sui/client";
import type { ServiceFeeVerificationResult } from "./types";

type BalanceChangeLike = { coinType?: unknown; amount?: unknown; owner?: unknown };

function ownerAddress(owner: unknown): string | null {
  if (typeof owner === "string") return owner;
  if (!owner || typeof owner !== "object") return null;
  const record = owner as Record<string, unknown>;
  for (const key of ["AddressOwner", "addressOwner", "address"]) if (typeof record[key] === "string") return record[key] as string;
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
  const candidates = input.rpcUrls.filter(Boolean);
  for (const baseUrl of candidates.length ? candidates : [process.env.POWERCHAIN_SUI_GRPC_URL ?? ""]) {
    if (!baseUrl) continue;
    try {
      const client = createPowerChainSuiClient({ ...process.env, POWERCHAIN_SUI_GRPC_URL: baseUrl });
      const result = await client.core.waitForTransaction({
        digest: input.digest,
        timeout: 15_000,
        include: { effects: true, balanceChanges: true, transaction: true },
      });
      const tx = result.Transaction ?? result.FailedTransaction;
      if (!tx || result.FailedTransaction || !tx.effects?.status?.success) {
        return { verified: false, finalized: true, sourceTx: input.digest, expectedBaseUnits: input.expectedBaseUnits, recipient: input.recipient, errorCode: "SERVICE_FEE_SUI_TX_FAILED", evidence: { baseUrl } };
      }
      let credited = 0n;
      for (const raw of (tx.balanceChanges ?? []) as unknown as BalanceChangeLike[]) {
        if (raw.coinType !== input.coinType || ownerAddress(raw.owner) !== input.recipient) continue;
        const amount = typeof raw.amount === "bigint" ? raw.amount : typeof raw.amount === "string" && /^-?\d+$/.test(raw.amount) ? BigInt(raw.amount) : 0n;
        if (amount > 0n) credited += amount;
      }
      const expected = BigInt(input.expectedBaseUnits);
      if (credited !== expected) {
        return { verified: false, finalized: true, sourceTx: input.digest, expectedBaseUnits: input.expectedBaseUnits, recipient: input.recipient, errorCode: "SERVICE_FEE_SUI_AMOUNT_MISMATCH", evidence: { baseUrl, creditedBaseUnits: credited.toString(), coinType: input.coinType } };
      }
      return { verified: true, finalized: true, sourceTx: input.digest, expectedBaseUnits: input.expectedBaseUnits, recipient: input.recipient, evidence: { baseUrl, creditedBaseUnits: credited.toString(), coinType: input.coinType } };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "SERVICE_FEE_SUI_GRPC_ERROR";
    }
  }
  return { verified: false, finalized: false, sourceTx: input.digest, expectedBaseUnits: input.expectedBaseUnits, recipient: input.recipient, errorCode: lastError, evidence: {} };
}
