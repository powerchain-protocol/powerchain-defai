import "server-only";
import { createHash } from "node:crypto";
import { getSolanaRpc, getSuiRpc } from "../rpc/providers";
import { getSuiCoinMetadata, getSuiChainIdentifier } from "./sui-metadata";

const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const COIN_TYPE = /^0x[a-fA-F0-9]+::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*(?:<.*>)?$/;
const DEFAULT_MAX_HEAD_AGE_MS = 120_000;

function env(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}
function requireEnv(label: string, ...names: string[]) {
  const value = env(...names);
  if (!value) throw new Error(`${label} is not configured`);
  return value;
}
function expectedDecimals() {
  const raw = Number(process.env.POWERCHAIN_PWRC_EXPECTED_DECIMALS ?? "9");
  if (!Number.isInteger(raw) || raw < 0 || raw > 18) throw new Error("POWERCHAIN_PWRC_EXPECTED_DECIMALS must be an integer from 0 to 18");
  return raw;
}
function expectedSupply() {
  const raw = process.env.POWERCHAIN_PWRC_EXPECTED_SUPPLY_BASE_UNITS?.trim();
  if (!raw || !/^\d+$/.test(raw) || BigInt(raw) <= 0n) throw new Error("POWERCHAIN_PWRC_EXPECTED_SUPPLY_BASE_UNITS must be a positive integer");
  return raw;
}
function maxHeadAgeMs() {
  const raw = Number(process.env.POWERCHAIN_CHAIN_HEAD_MAX_AGE_MS ?? DEFAULT_MAX_HEAD_AGE_MS);
  if (!Number.isInteger(raw) || raw < 30_000 || raw > 600_000) throw new Error("POWERCHAIN_CHAIN_HEAD_MAX_AGE_MS must be 30000-600000");
  return raw;
}

type ParsedExtension = { extension?: string; state?: Record<string, unknown> };
type ParsedMintInfo = {
  decimals?: number;
  supply?: string;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  isInitialized?: boolean;
  extensions?: ParsedExtension[];
};
type SolanaAccountInfo = {
  context?: { slot?: number };
  value?: {
    owner?: string;
    executable?: boolean;
    data?: { program?: string; parsed?: { type?: string; info?: ParsedMintInfo } } | [string, string];
  } | null;
};
type SuiCheckpoint = { timestampMs?: string; sequenceNumber?: string; digest?: string };

export type IntegrityCheck = {
  id: string;
  ok: boolean;
  expected?: string | number | boolean | null;
  actual?: string | number | boolean | null;
};
function check(id: string, ok: boolean, expected?: IntegrityCheck["expected"], actual?: IntegrityCheck["actual"]): IntegrityCheck {
  return { id, ok, ...(expected !== undefined ? { expected } : {}), ...(actual !== undefined ? { actual } : {}) };
}
function normalizeExtensionName(value: string) { return value.replace(/[^a-z0-9]/gi, "").toLowerCase(); }

const REQUIRED_MINT_EXTENSIONS = new Set(["metadatapointer", "tokenmetadata"]);
const FORBIDDEN_MINT_EXTENSIONS = new Set([
  "transferfeeconfig",
  "permanentdelegate",
  "mintcloseauthority",
  "defaultaccountstate",
  "interestbearingconfig",
  "scaleduiamountconfig",
  "pausable",
  "pausableconfig",
  "transferhook",
  "nontransferable",
  "confidentialtransfermint",
  "confidentialmintburn",
]);

function extensionPolicy(info: ParsedMintInfo, mint: string) {
  const raw = Array.isArray(info.extensions) ? info.extensions : [];
  const normalized = raw.map((entry) => ({
    name: normalizeExtensionName(String(entry.extension ?? "")),
    original: String(entry.extension ?? ""),
    state: entry.state && typeof entry.state === "object" ? entry.state : {},
  })).filter((entry) => entry.name);
  const names = new Set(normalized.map((entry) => entry.name));
  const checks: IntegrityCheck[] = [];
  for (const required of REQUIRED_MINT_EXTENSIONS) checks.push(check(`extension-required:${required}`, names.has(required), true, names.has(required)));
  for (const forbidden of FORBIDDEN_MINT_EXTENSIONS) if (names.has(forbidden)) checks.push(check(`extension-forbidden:${forbidden}`, false, false, true));
  const pointer = normalized.find((entry) => entry.name === "metadatapointer");
  if (pointer) {
    const address = ["metadataAddress", "metadata_address", "metadata"].map((key) => pointer.state[key]).find((v) => typeof v === "string") as string | undefined;
    checks.push(check("metadata-pointer-self", address === mint, mint, address ?? null));
  }
  const metadata = normalized.find((entry) => entry.name === "tokenmetadata");
  if (metadata) {
    const symbol = typeof metadata.state.symbol === "string" ? metadata.state.symbol : undefined;
    const metadataMint = typeof metadata.state.mint === "string" ? metadata.state.mint : undefined;
    const expectedSymbol = process.env.POWERCHAIN_PWRC_EXPECTED_SYMBOL?.trim() || "PWRC";
    if (symbol !== undefined) checks.push(check("metadata-symbol", symbol === expectedSymbol, expectedSymbol, symbol));
    if (metadataMint !== undefined) checks.push(check("metadata-mint", metadataMint === mint, mint, metadataMint));
  }
  return { names: normalized.map((entry) => entry.original).sort(), checks };
}

function ageCheck(id: string, observedAtMs: number | null, limitMs: number) {
  const ageMs = observedAtMs === null ? null : Math.max(0, Date.now() - observedAtMs);
  return { ageMs, check: check(id, ageMs !== null && ageMs <= limitMs, `<=${limitMs}ms`, ageMs === null ? null : `${ageMs}ms`) };
}
function stableHash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

export async function checkSolanaPwrcIntegrity() {
  const mint = requireEnv("PWRC Solana mint", "POWERCHAIN_PWRC_SOLANA_MINT", "PWRC_SOLANA_MINT", "SOLANA_PWRC_MINT");
  if (!SOLANA_ADDRESS.test(mint)) throw new Error("invalid PWRC Solana mint");
  const runtime = getSolanaRpc();
  const genesisPromise = process.env.NODE_ENV === "production"
    ? runtime.client.requestQuorum<string>("getGenesisHash", [], { requestBudgetMs: 8_000 })
    : runtime.client.request<string>("getGenesisHash", [], { cacheTtlMs: 5_000, staleIfErrorMs: 0, requestBudgetMs: 8_000 })
        .then((value) => ({ value, endpoints: ["development-single-provider", "development-single-provider"] as [string, string] }));
  const account = await runtime.client.request<SolanaAccountInfo>(
    "getAccountInfo", [mint, { commitment: "finalized", encoding: "jsonParsed" }],
    { cacheTtlMs: 2_000, staleIfErrorMs: 0, requestBudgetMs: 8_000 },
  );
  const slot = account.context?.slot;
  const [genesis, blockTime] = await Promise.all([
    genesisPromise,
    typeof slot === "number"
      ? runtime.client.request<number | null>("getBlockTime", [slot], { cacheTtlMs: 2_000, staleIfErrorMs: 0, requestBudgetMs: 8_000 })
      : Promise.resolve(null),
  ]);
  const value = account.value;
  if (!value) throw new Error("PWRC mint account does not exist");
  const data = value.data;
  if (!data || Array.isArray(data) || typeof data !== "object") throw new Error("PWRC mint did not return parsed Token-2022 data");
  const parsed = data.parsed;
  const info = parsed?.info;
  if (parsed?.type !== "mint" || !info) throw new Error("PWRC account is not a parsed token mint");
  const decimals = expectedDecimals();
  const supply = expectedSupply();
  const expectedGenesisHash = process.env.POWERCHAIN_SOLANA_EXPECTED_GENESIS_HASH?.trim();
  const ext = extensionPolicy(info, mint);
  const freshness = ageCheck("finalized-head-fresh", typeof blockTime === "number" ? blockTime * 1000 : null, maxHeadAgeMs());
  const checks: IntegrityCheck[] = [
    check(process.env.NODE_ENV === "production" ? "rpc-genesis-quorum" : "rpc-genesis-identity", typeof genesis.value === "string" && genesis.value.length > 0, true, genesis.value || null),
    ...(expectedGenesisHash ? [check("network-identity", genesis.value === expectedGenesisHash, expectedGenesisHash, genesis.value)] : []),
    check("token2022-program", value.owner === TOKEN_2022_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, value.owner ?? null),
    check("mint-account-type", parsed.type === "mint", "mint", parsed.type ?? null),
    check("mint-initialized", info.isInitialized !== false, true, info.isInitialized ?? true),
    check("decimals", info.decimals === decimals, decimals, info.decimals ?? null),
    check("fixed-supply", info.supply === supply, supply, info.supply ?? null),
    check("mint-authority-revoked", info.mintAuthority == null, null, info.mintAuthority ?? null),
    check("freeze-authority-revoked", info.freezeAuthority == null, null, info.freezeAuthority ?? null),
    check("mint-not-executable", value.executable === false, false, value.executable ?? null),
    freshness.check,
    ...ext.checks,
  ];
  const fingerprintMaterial = {
    chain: "SOLANA", genesisHash: genesis.value, mint, program: TOKEN_2022_PROGRAM_ID,
    decimals, supply, extensions: ext.names.map(normalizeExtensionName).sort(),
  };
  return {
    chain: "SOLANA" as const, asset: "PWRC" as const, mint,
    finalizedSlot: slot ?? null, finalizedBlockTime: blockTime ?? null, headAgeMs: freshness.ageMs,
    genesisHash: genesis.value, rpcQuorumEndpoints: genesis.endpoints,
    extensions: ext.names, fingerprint: stableHash(fingerprintMaterial),
    healthy: checks.every((entry) => entry.ok), checks, checkedAt: new Date().toISOString(),
    source: "finalized-chain-rpc" as const, authoritativeForBridgeAccounting: false as const,
  };
}

export async function checkSuiWpwrcIntegrity() {
  const coinType = requireEnv("wPWRC Sui coin type", "WPWRC_SUI_COIN_TYPE", "SUI_WPWRC_COIN_TYPE");
  if (!COIN_TYPE.test(coinType)) throw new Error("invalid wPWRC Sui coin type");
  const [metadata, chainIdentifier, checkpointSequence] = await Promise.all([
    getSuiCoinMetadata(coinType), getSuiChainIdentifier().catch(() => null),
    getSuiRpc().client.request<string>("sui_getLatestCheckpointSequenceNumber", [], { cacheTtlMs: 2_000, staleIfErrorMs: 0, requestBudgetMs: 8_000 }),
  ]);
  const checkpoint = await getSuiRpc().client.request<SuiCheckpoint>("sui_getCheckpoint", [checkpointSequence], { cacheTtlMs: 2_000, staleIfErrorMs: 0, requestBudgetMs: 8_000 });
  const decimals = expectedDecimals();
  const expectedSymbol = process.env.POWERCHAIN_WPWRC_EXPECTED_SYMBOL?.trim() || "wPWRC";
  const expectedChainIdentifier = process.env.POWERCHAIN_SUI_EXPECTED_CHAIN_IDENTIFIER?.trim();
  const observedMs = checkpoint.timestampMs && /^\d+$/.test(checkpoint.timestampMs) ? Number(checkpoint.timestampMs) : null;
  const freshness = ageCheck("checkpoint-fresh", Number.isFinite(observedMs) ? observedMs : null, maxHeadAgeMs());
  const checks: IntegrityCheck[] = [
    check("coin-type-configured", true, coinType, coinType),
    check("metadata-available", metadata !== null, true, metadata !== null),
    check("chain-identifier-available", chainIdentifier !== null, true, chainIdentifier !== null),
    ...(expectedChainIdentifier ? [check("network-identity", chainIdentifier === expectedChainIdentifier, expectedChainIdentifier, chainIdentifier)] : []),
    freshness.check,
  ];
  if (metadata) checks.push(
    check("decimals", metadata.decimals === decimals, decimals, metadata.decimals ?? null),
    check("symbol", metadata.symbol === expectedSymbol, expectedSymbol, metadata.symbol ?? null),
  );
  const fingerprintMaterial = { chain: "SUI", chainIdentifier, coinType, decimals, symbol: expectedSymbol };
  return {
    chain: "SUI" as const, asset: "wPWRC" as const, coinType, chainIdentifier,
    checkpoint: checkpoint.sequenceNumber ?? checkpointSequence, checkpointDigest: checkpoint.digest ?? null,
    checkpointTimestampMs: checkpoint.timestampMs ?? null, headAgeMs: freshness.ageMs,
    metadata: metadata ? { name: metadata.name ?? null, symbol: metadata.symbol ?? null, decimals: metadata.decimals ?? null, supply: metadata.supply ?? null } : null,
    fingerprint: stableHash(fingerprintMaterial), healthy: checks.every((entry) => entry.ok), checks,
    checkedAt: new Date().toISOString(), source: metadata ? "sui-rpc+graphql" as const : "sui-rpc" as const,
    authoritativeForBridgeAccounting: false as const,
  };
}

export async function checkPwrcAssetIntegrity() {
  const [solana, sui] = await Promise.allSettled([checkSolanaPwrcIntegrity(), checkSuiWpwrcIntegrity()]);
  const solanaResult = solana.status === "fulfilled" ? { ok: solana.value.healthy, data: solana.value } : { ok: false, error: solana.reason instanceof Error ? solana.reason.message : "Solana integrity check failed" };
  const suiResult = sui.status === "fulfilled" ? { ok: sui.value.healthy, data: sui.value } : { ok: false, error: sui.reason instanceof Error ? sui.reason.message : "Sui integrity check failed" };
  const combinedMaterial = {
    version: 1,
    solana: solanaResult.ok && "data" in solanaResult ? solanaResult.data.fingerprint : null,
    sui: suiResult.ok && "data" in suiResult ? suiResult.data.fingerprint : null,
  };
  const assetFingerprint = stableHash(combinedMaterial);
  const expectedFingerprint = process.env.POWERCHAIN_PWRC_EXPECTED_ASSET_FINGERPRINT?.trim().toLowerCase();
  const fingerprintCheck = expectedFingerprint
    ? check("asset-fingerprint", assetFingerprint === expectedFingerprint, expectedFingerprint, assetFingerprint)
    : null;
  return {
    asset: "PWRC",
    healthy: solanaResult.ok && suiResult.ok && (fingerprintCheck?.ok ?? true),
    solana: solanaResult, sui: suiResult,
    assetFingerprint, fingerprintPinned: Boolean(expectedFingerprint), fingerprintCheck,
    checkedAt: new Date().toISOString(), authoritativeForBridgeAccounting: false as const,
  };
}
