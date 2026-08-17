import "server-only";
import type { StakingTransactionStatus } from "@powerchain/staking";

const RPC_TIMEOUT_MS = 5_000;
const SIGNATURE_RE = /^[1-9A-HJ-NP-Za-km-z]{80,90}$/;

function rpcUrls(): string[] {
  const values = [process.env.POWERCHAIN_SOLANA_RPC_URL, process.env.POWERCHAIN_SOLANA_STAKING_RPC_FALLBACK_URL, ...(process.env.POWERCHAIN_SOLANA_RPC_FALLBACK_URLS ?? "").split(",")];
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

async function signatureStatus(url: string, signature: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: "powerchain-staking-signature-status", method: "getSignatureStatuses", params: [[signature], { searchTransactionHistory: true }] }), signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`STAKING_SIGNATURE_RPC_HTTP_${response.status}`);
    const payload = await response.json() as { result?: { value?: Array<{ slot?: number; err?: unknown; confirmationStatus?: "processed" | "confirmed" | "finalized" } | null> }; error?: { message?: string } };
    if (payload.error || !payload.result?.value) throw new Error(payload.error?.message ?? "STAKING_SIGNATURE_RPC_INVALID_RESPONSE");
    return payload.result.value[0] ?? null;
  } finally { clearTimeout(timeout); }
}

export async function stakingTransactionStatus(signatureInput: string): Promise<StakingTransactionStatus> {
  const signature = signatureInput.trim();
  if (!SIGNATURE_RE.test(signature)) throw new Error("INVALID_SOLANA_TRANSACTION_SIGNATURE");
  const urls = rpcUrls();
  if (!urls.length) throw new Error("SOLANA_RPC_REQUIRED");
  const failures: string[] = [];
  for (const url of urls) {
    try {
      const status = await signatureStatus(url, signature);
      const checkedAt = new Date().toISOString();
      if (!status) return { chain: "SOLANA", signature, state: "not_found", source: "solana-rpc", checkedAt };
      if (status.err != null) return { chain: "SOLANA", signature, state: "failed", ...(status.slot === undefined ? {} : { slot: String(status.slot) }), error: status.err, source: "solana-rpc", checkedAt };
      const confirmationStatus = status.confirmationStatus ?? "processed";
      return { chain: "SOLANA", signature, state: confirmationStatus, ...(status.slot === undefined ? {} : { slot: String(status.slot) }), confirmationStatus, source: "solana-rpc", checkedAt };
    } catch (reason) { failures.push(reason instanceof Error ? reason.message : "STAKING_SIGNATURE_RPC_FAILED"); }
  }
  throw new Error(`STAKING_SIGNATURE_VERIFICATION_FAILED:${failures.join("|")}`);
}
