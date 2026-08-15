import "server-only";

const CLAIM_MEMO_PREFIX = "POWERCHAIN_CLAIM:";

export type NormalizedWalletActivity = {
  chain: "SOLANA" | "SUI";
  id: string;
  kind: "CLAIM" | "PWRC_TRANSFER" | "SOLANA_ACTIVITY" | "SUI_ACTIVITY";
  status: string | null;
  timestamp: number | null;
  label: string;
  explorerUrl: string | null;
  source: string;
};

type ActivityRecord = Record<string, unknown>;

function record(value: unknown): ActivityRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ActivityRecord : {};
}

function pwrcMint() {
  return process.env.POWERCHAIN_PWRC_SOLANA_MINT?.trim() || null;
}

function normalizeMemo(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function classifySolanaActivity(value: unknown, source: string): NormalizedWalletActivity | null {
  const row = record(value);
  const signature = typeof row.signature === "string" ? row.signature : null;
  if (!signature) return null;
  const memo = normalizeMemo(row.memo);
  const configuredMint = pwrcMint();
  const tokenTransfers = Array.isArray(row.tokenTransfers) ? row.tokenTransfers.map(record) : [];
  const isPwrcTransfer = Boolean(configuredMint && tokenTransfers.some((item) => item.mint === configuredMint));
  const isClaim = memo.startsWith(CLAIM_MEMO_PREFIX);
  const kind: NormalizedWalletActivity["kind"] = isClaim ? "CLAIM" : isPwrcTransfer ? "PWRC_TRANSFER" : "SOLANA_ACTIVITY";
  const rawLabel = typeof row.description === "string" && row.description.trim()
    ? row.description.trim()
    : typeof row.type === "string" && row.type.trim()
      ? row.type.trim().replaceAll("_", " ")
      : isClaim ? "PWRC claim" : isPwrcTransfer ? "PWRC transfer" : "Solana transaction";
  const status = row.err == null
    ? typeof row.status === "string" ? row.status : typeof row.confirmationStatus === "string" ? row.confirmationStatus : "success"
    : "failed";
  return {
    chain: "SOLANA", id: signature, kind, status,
    timestamp: typeof row.timestamp === "number" ? row.timestamp : typeof row.blockTime === "number" ? row.blockTime : null,
    label: rawLabel,
    explorerUrl: typeof row.explorerUrl === "string" ? row.explorerUrl : null,
    source,
  };
}

export function classifySuiActivity(value: unknown, source: string): NormalizedWalletActivity | null {
  const row = record(value);
  const digest = typeof row.digest === "string" ? row.digest : null;
  if (!digest) return null;
  return {
    chain: "SUI", id: digest, kind: "SUI_ACTIVITY",
    status: typeof row.status === "string" ? row.status : null,
    timestamp: typeof row.timestamp === "number" ? row.timestamp : null,
    label: "Sui transaction",
    explorerUrl: typeof row.explorerUrl === "string" ? row.explorerUrl : null,
    source,
  };
}

export function mergeWalletActivity(solanaRows: unknown[], solanaSource: string, suiRows: unknown[], suiSource: string, limit = 50) {
  const rows = [
    ...solanaRows.map((row) => classifySolanaActivity(row, solanaSource)).filter((row): row is NormalizedWalletActivity => row !== null),
    ...suiRows.map((row) => classifySuiActivity(row, suiSource)).filter((row): row is NormalizedWalletActivity => row !== null),
  ];
  return rows.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0) || a.id.localeCompare(b.id)).slice(0, Math.max(1, Math.min(limit, 100)));
}
