import "server-only";
import { PublicKey } from "@solana/web3.js";
import { decodeSolanaStakePosition, stakingStatus, type StakingConfiguration, type StakingPositionStatus } from "@powerchain/staking";

const POSITION_SEED = Buffer.from("staking-position", "utf8");
const RPC_TIMEOUT_MS = 5_000;

function identifier(config: StakingConfiguration, name: StakingConfiguration["identifiers"][number]["name"]): string {
  const value = config.identifiers.find((item) => item.name === name)?.value?.trim();
  if (!value) throw new Error(`STAKING_${name.toUpperCase().replace(/-/g, "_")}_UNAVAILABLE`);
  return value;
}

function rpcUrls(): string[] {
  const values = [
    process.env.POWERCHAIN_SOLANA_RPC_URL,
    process.env.POWERCHAIN_SOLANA_STAKING_RPC_FALLBACK_URL,
    ...(process.env.POWERCHAIN_SOLANA_RPC_FALLBACK_URLS ?? "").split(","),
  ];
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

async function rpc<T>(url: string, method: string, params: readonly unknown[]): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: `powerchain-staking-position-${method}`, method, params }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`STAKING_POSITION_RPC_HTTP_${response.status}`);
    const payload = await response.json() as { result?: T; error?: { message?: string } };
    if (payload.error || payload.result === undefined) throw new Error(payload.error?.message ?? "STAKING_POSITION_RPC_INVALID_RESPONSE");
    return payload.result;
  } finally {
    clearTimeout(timeout);
  }
}

export async function stakingPositionStatus(walletAddress: string): Promise<StakingPositionStatus> {
  const checkedAt = new Date().toISOString();
  let wallet: PublicKey;
  try { wallet = new PublicKey(walletAddress); } catch { throw new Error("INVALID_SOLANA_WALLET_ADDRESS"); }

  const status = await stakingStatus();
  const config = status.configurations.find((item) => item.chain === "SOLANA");
  if (!config?.executable || config.paused) {
    return { chain: "SOLANA", walletAddress: wallet.toBase58(), positionAddress: "UNAVAILABLE", exists: false, executable: false, reason: config?.reason ?? "STAKING_DEPLOYMENT_NOT_EXECUTABLE", checkedAt };
  }

  const programId = new PublicKey(identifier(config, "program"));
  const [position] = PublicKey.findProgramAddressSync([POSITION_SEED, wallet.toBuffer()], programId);
  const urls = rpcUrls();
  if (!urls.length) return { chain: "SOLANA", walletAddress: wallet.toBase58(), positionAddress: position.toBase58(), exists: false, executable: false, reason: "SOLANA_RPC_REQUIRED", checkedAt };

  const failures: string[] = [];
  for (const url of urls) {
    try {
      const [accountResult, slot] = await Promise.all([
        rpc<{ value: { owner?: string; data?: [string, string] } | null }>(url, "getAccountInfo", [position.toBase58(), { encoding: "base64", commitment: "confirmed" }]),
        rpc<number>(url, "getSlot", [{ commitment: "confirmed" }]),
      ]);
      const account = accountResult.value;
      if (!account) return { chain: "SOLANA", walletAddress: wallet.toBase58(), positionAddress: position.toBase58(), exists: false, executable: true, currentSlot: String(slot), checkedAt };
      if (account.owner !== programId.toBase58()) throw new Error("STAKING_POSITION_OWNER_PROGRAM_MISMATCH");
      const encoded = Array.isArray(account.data) ? account.data[0] : undefined;
      if (!encoded) throw new Error("STAKING_POSITION_DATA_MISSING");
      const snapshot = decodeSolanaStakePosition(encoded);
      if (snapshot.owner !== wallet.toBase58()) throw new Error("STAKING_POSITION_WALLET_MISMATCH");
      const cooldownComplete = BigInt(snapshot.pendingUnstakeBaseUnits) > 0n && BigInt(slot) >= BigInt(snapshot.unstakeAvailableSlot);
      return { chain: "SOLANA", walletAddress: wallet.toBase58(), positionAddress: position.toBase58(), exists: true, executable: true, currentSlot: String(slot), snapshot, cooldownComplete, checkedAt };
    } catch (reason) {
      failures.push(reason instanceof Error ? reason.message : "STAKING_POSITION_RPC_FAILED");
    }
  }
  return { chain: "SOLANA", walletAddress: wallet.toBase58(), positionAddress: position.toBase58(), exists: false, executable: false, reason: `STAKING_POSITION_VERIFICATION_FAILED:${failures.join("|")}`, checkedAt };
}
