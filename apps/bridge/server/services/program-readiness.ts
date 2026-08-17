import "server-only";
import { createHash } from "node:crypto";
import { PROTOCOL_PROGRAMS } from "@powerchain/protocol/programs";
import { POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID, serverProtocolAddresses } from "@powerchain/protocol/addresses";
import { stakingStatus } from "@powerchain/staking";
import { verifyEscrowRuntimeStatus } from "@powerchain/backend/escrow/config";
import { getSolanaRpc, getSuiRpc } from "@/server/rpc/providers";
import type { ProgramReadinessPayload, ProgramRuntimeItem } from "@/types/programs";

export type ProgramRuntimeId = "solana-bridge" | "solana-staking" | "solana-escrow" | "sui-bridge";
type ProgramRuntimeCandidate = Omit<ProgramRuntimeItem, "checkedAt" | "verificationDurationMs" | "timedOut" | "evidenceMode" | "cacheAgeMs">;
type SolanaAccount = { value: { executable?: boolean; owner?: string } | null };
type SuiObjectOwner = { Shared?: { initial_shared_version?: string } } | Record<string, unknown> | string;
type SuiObject = { data?: { objectId?: string; dataType?: string; type?: string; owner?: SuiObjectOwner }; error?: { code?: string; error?: string } };

const PROGRAM_IDS = new Set<ProgramRuntimeId>(["solana-bridge", "solana-staking", "solana-escrow", "sui-bridge"]);

const SOLANA_PROGRAM_LOADERS = Object.freeze({
  "BPFLoader1111111111111111111111111111111111": "bpf-loader-v1",
  "BPFLoader2111111111111111111111111111111111": "bpf-loader-v2",
  "BPFLoaderUpgradeab1e11111111111111111111111": "bpf-upgradeable",
  "LoaderV411111111111111111111111111111111111": "loader-v4",
} as const);
type SolanaProgramLoader = (typeof SOLANA_PROGRAM_LOADERS)[keyof typeof SOLANA_PROGRAM_LOADERS];

function recognizedSolanaLoader(owner: string | undefined): SolanaProgramLoader | undefined {
  if (!owner) return undefined;
  return SOLANA_PROGRAM_LOADERS[owner as keyof typeof SOLANA_PROGRAM_LOADERS];
}

function isSuiSharedOwner(owner: SuiObjectOwner | undefined): boolean {
  return Boolean(owner) && typeof owner === "object" && !Array.isArray(owner) && "Shared" in owner;
}

const PROGRAM_VERIFIER_TIMEOUT_MS = boundedInteger(process.env.POWERCHAIN_PROGRAM_VERIFIER_TIMEOUT_MS, 7_000, 1_000, 15_000);
const PROGRAM_EVIDENCE_CACHE_TTL_MS = boundedInteger(process.env.POWERCHAIN_PROGRAM_EVIDENCE_CACHE_TTL_MS, 15_000, 1_000, 60_000);
const evidenceCache = new Map<ProgramRuntimeId, { readonly fingerprint: string; readonly item: ProgramRuntimeItem; readonly storedAt: number }>();
const inFlight = new Map<ProgramRuntimeId, { readonly fingerprint: string; readonly task: Promise<ProgramRuntimeItem> }>();

class ProgramVerifierTimeoutError extends Error {
  constructor(readonly programId: ProgramRuntimeId, readonly timeoutMs: number) {
    super(`PROGRAM_VERIFIER_TIMEOUT:${programId}:${timeoutMs}`);
    this.name = "ProgramVerifierTimeoutError";
  }
}

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = value == null || value.trim() === "" ? fallback : Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

async function withVerifierDeadline<T>(programId: ProgramRuntimeId, operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const timeout = new ProgramVerifierTimeoutError(programId, PROGRAM_VERIFIER_TIMEOUT_MS);
      controller.abort(timeout);
      reject(timeout);
    }, PROGRAM_VERIFIER_TIMEOUT_MS);
  });
  try {
    return await Promise.race([operation(controller.signal), deadline]);
  } catch (error) {
    if (controller.signal.aborted && controller.signal.reason instanceof ProgramVerifierTimeoutError) throw controller.signal.reason;
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function stableFingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function deploymentFingerprint(id: ProgramRuntimeId): string {
  const addresses = serverProtocolAddresses();
  if (id === "solana-bridge") return stableFingerprint({ id, programId: addresses.solanaBridgeProgramId || POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID });
  if (id === "sui-bridge") return stableFingerprint({ id, packageId: addresses.suiBridgePackageId, configId: addresses.suiBridgeConfigObjectId, informationId: addresses.suiInformationCommitmentObjectId });
  if (id === "solana-escrow") return stableFingerprint({ id, programId: process.env.POWERCHAIN_SOLANA_ESCROW_PROGRAM_ID?.trim() ?? "" });
  return stableFingerprint({
    id,
    programId: process.env.POWERCHAIN_SOLANA_STAKING_PROGRAM_ID?.trim() ?? "",
    config: process.env.POWERCHAIN_SOLANA_STAKING_CONFIG?.trim() ?? "",
    stakeVault: process.env.POWERCHAIN_SOLANA_STAKING_VAULT?.trim() ?? "",
    rewardVault: process.env.POWERCHAIN_SOLANA_STAKING_REWARD_VAULT?.trim() ?? "",
    rpcUrl: process.env.POWERCHAIN_SOLANA_RPC_URL?.trim() ?? "",
    rpcFallbackUrl: process.env.POWERCHAIN_SOLANA_RPC_FALLBACK_URL?.trim() ?? "",
    rpcFallbackUrls: process.env.POWERCHAIN_SOLANA_RPC_FALLBACK_URLS?.trim() ?? "",
  });
}

export function isProgramRuntimeId(value: string): value is ProgramRuntimeId {
  return PROGRAM_IDS.has(value as ProgramRuntimeId);
}

function source(id: ProgramRuntimeId) {
  const found = PROTOCOL_PROGRAMS.find((item) => item.id === id);
  if (!found) throw new Error(`PROGRAM_SOURCE_NOT_FOUND:${id}`);
  return found;
}

function base(id: ProgramRuntimeId) {
  const item = source(id);
  return {
    id: item.id,
    label: item.label,
    chain: item.chain,
    kind: item.kind,
    sourcePath: item.sourcePath,
    purpose: item.purpose,
    custody: item.custody,
    principalMovement: item.principalMovement,
    requiredForCoreBridge: item.requiredForCoreBridge,
    ...(item.configVersion === undefined ? {} : { configVersion: item.configVersion }),
  } as const;
}

async function solanaBridge(signal: AbortSignal): Promise<ProgramRuntimeCandidate> {
  const addresses = serverProtocolAddresses();
  const identifier = addresses.solanaBridgeProgramId || POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID;
  try {
    const result = await getSolanaRpc().client.requestWithMeta<SolanaAccount>("getAccountInfo", [identifier, { encoding: "base64", commitment: "confirmed" }], { signal, timeoutMs: 4_000, requestBudgetMs: 5_000, cacheTtlMs: 1_000, staleIfErrorMs: 0 });
    const account = result.value.value;
    const loader = recognizedSolanaLoader(account?.owner);
    const executable = account?.executable === true && Boolean(loader) && !result.meta.stale;
    const reason = !account ? "SOLANA_BRIDGE_PROGRAM_NOT_FOUND" : result.meta.stale ? "SOLANA_BRIDGE_EVIDENCE_STALE" : account.executable !== true ? "SOLANA_BRIDGE_PROGRAM_NOT_EXECUTABLE" : !loader ? "SOLANA_BRIDGE_PROGRAM_LOADER_UNRECOGNIZED" : undefined;
    return {
      ...base("solana-bridge"),
      state: executable ? "verified" : "gated",
      configured: true,
      verified: executable,
      executable,
      identifier,
      evidenceSource: "solana-rpc",
      ...(loader && account?.owner ? { deploymentEvidence: { kind: "solana-loader" as const, accountOwner: account.owner, loader } } : {}),
      ...(reason ? { reason } : {}),
    };
  } catch (error) {
    if (signal.aborted) throw signal.reason instanceof Error ? signal.reason : new Error("SOLANA_BRIDGE_VERIFICATION_ABORTED");
    return { ...base("solana-bridge"), state: "unavailable", configured: true, verified: false, executable: false, identifier, evidenceSource: "solana-rpc", reason: error instanceof Error ? error.name : "SOLANA_BRIDGE_VERIFICATION_UNAVAILABLE" };
  }
}

async function solanaStaking(signal: AbortSignal): Promise<ProgramRuntimeCandidate> {
  const status = await stakingStatus({ signal });
  const configuration = status.configurations.find((item) => item.chain === "SOLANA");
  const identifier = configuration?.identifiers.find((item) => item.name === "program")?.value;
  if (!configuration) return { ...base("solana-staking"), state: "unconfigured", configured: false, verified: false, executable: false, evidenceSource: "staking-verifier", reason: "STAKING_CONFIGURATION_UNAVAILABLE" };
  return { ...base("solana-staking"), state: configuration.executable ? "verified" : configuration.state === "disabled" ? "unconfigured" : configuration.state === "unavailable" ? "unavailable" : "gated", configured: configuration.state !== "disabled", verified: configuration.deploymentEvidence.status === "verified", executable: configuration.executable, evidenceSource: "staking-verifier", ...(identifier ? { identifier } : {}), ...(configuration.reason ? { reason: configuration.reason } : {}) };
}

async function solanaEscrow(signal: AbortSignal): Promise<ProgramRuntimeCandidate> {
  const status = await verifyEscrowRuntimeStatus({ signal });
  return { ...base("solana-escrow"), state: status.executable && status.verified ? "verified" : !status.configured ? "unconfigured" : status.evidence.status === "unavailable" ? "unavailable" : "gated", configured: status.configured, verified: status.verified, executable: status.executable, evidenceSource: "escrow-verifier", ...(status.programId ? { identifier: status.programId } : {}), ...(status.reason ? { reason: status.reason } : {}) };
}

async function suiBridge(signal: AbortSignal): Promise<ProgramRuntimeCandidate> {
  const addresses = serverProtocolAddresses();
  const packageId = addresses.suiBridgePackageId;
  const configId = addresses.suiBridgeConfigObjectId;
  const informationId = addresses.suiInformationCommitmentObjectId;
  if (!packageId) return { ...base("sui-bridge"), state: "unconfigured", configured: false, verified: false, executable: false, evidenceSource: "operator-config", reason: "SUI_BRIDGE_PACKAGE_ID_REQUIRED" };
  if (!configId || !informationId) return { ...base("sui-bridge"), state: "verification-required", configured: true, verified: false, executable: false, identifier: packageId, evidenceSource: "operator-config", reason: "SUI_BRIDGE_CONFIG_AND_INFORMATION_OBJECTS_REQUIRED" };
  try {
    const rpc = getSuiRpc().client;
    const [pkg, config, information] = await Promise.all([
      rpc.requestWithMeta<SuiObject>("sui_getObject", [packageId, { showType: true, showOwner: true }], { signal, timeoutMs: 4_000, requestBudgetMs: 5_000, cacheTtlMs: 1_000, staleIfErrorMs: 0 }),
      rpc.requestWithMeta<SuiObject>("sui_getObject", [configId, { showType: true, showOwner: true }], { signal, timeoutMs: 4_000, requestBudgetMs: 5_000, cacheTtlMs: 1_000, staleIfErrorMs: 0 }),
      rpc.requestWithMeta<SuiObject>("sui_getObject", [informationId, { showType: true, showOwner: true }], { signal, timeoutMs: 4_000, requestBudgetMs: 5_000, cacheTtlMs: 1_000, staleIfErrorMs: 0 }),
    ]);
    const fresh = !pkg.meta.stale && !config.meta.stale && !information.meta.stale;
    const present = pkg.value.data?.objectId === packageId && config.value.data?.objectId === configId && information.value.data?.objectId === informationId;
    const packageTypeOk = pkg.value.data?.dataType === "package";
    const configTypeOk = config.value.data?.type === `${packageId}::powerchain_bridge::BridgeConfig`;
    const informationTypeOk = information.value.data?.type === `${packageId}::powerchain_bridge::InformationCommitment`;
    const configShared = isSuiSharedOwner(config.value.data?.owner);
    const informationShared = isSuiSharedOwner(information.value.data?.owner);
    const ownershipOk = configShared && informationShared;
    const verified = fresh && present && packageTypeOk && configTypeOk && informationTypeOk && ownershipOk;
    const reason = !present ? "SUI_BRIDGE_OBJECT_EVIDENCE_MISMATCH" : !fresh ? "SUI_BRIDGE_EVIDENCE_STALE" : !packageTypeOk ? "SUI_BRIDGE_PACKAGE_TYPE_MISMATCH" : !configTypeOk ? "SUI_BRIDGE_CONFIG_TYPE_MISMATCH" : !informationTypeOk ? "SUI_INFORMATION_COMMITMENT_TYPE_MISMATCH" : !configShared ? "SUI_BRIDGE_CONFIG_NOT_SHARED" : !informationShared ? "SUI_INFORMATION_COMMITMENT_NOT_SHARED" : undefined;
    return {
      ...base("sui-bridge"),
      state: verified ? "verified" : "gated",
      configured: true,
      verified,
      executable: verified,
      identifier: packageId,
      evidenceSource: "sui-rpc",
      deploymentEvidence: { kind: "sui-shared-objects", configShared, informationShared },
      ...(reason ? { reason } : {}),
    };
  } catch (error) {
    if (signal.aborted) throw signal.reason instanceof Error ? signal.reason : new Error("SUI_BRIDGE_VERIFICATION_ABORTED");
    return { ...base("sui-bridge"), state: "unavailable", configured: true, verified: false, executable: false, identifier: packageId, evidenceSource: "sui-rpc", reason: error instanceof Error ? error.name : "SUI_BRIDGE_VERIFICATION_UNAVAILABLE" };
  }
}

const VERIFIERS: Readonly<Record<ProgramRuntimeId, (signal: AbortSignal) => Promise<ProgramRuntimeCandidate>>> = Object.freeze({
  "solana-bridge": solanaBridge,
  "solana-staking": solanaStaking,
  "solana-escrow": solanaEscrow,
  "sui-bridge": suiBridge,
});

async function verifyProgramRuntimeItem(id: ProgramRuntimeId): Promise<ProgramRuntimeItem> {
  const started = Date.now();
  try {
    const item = await withVerifierDeadline(id, (signal) => VERIFIERS[id](signal));
    return { ...item, timedOut: false, checkedAt: new Date().toISOString(), verificationDurationMs: Math.max(0, Date.now() - started), evidenceMode: "live", cacheAgeMs: 0 };
  } catch (error) {
    return {
      ...base(id),
      state: "unavailable",
      configured: false,
      verified: false,
      executable: false,
      timedOut: error instanceof ProgramVerifierTimeoutError,
      evidenceSource: "runtime-verifier",
      reason: error instanceof Error ? error.message || error.name : "PROGRAM_VERIFIER_FAILED",
      checkedAt: new Date().toISOString(),
      verificationDurationMs: Math.max(0, Date.now() - started),
      evidenceMode: "live",
      cacheAgeMs: 0,
    };
  }
}

async function freshProgramRuntimeItem(id: ProgramRuntimeId, fingerprint: string): Promise<ProgramRuntimeItem> {
  const existing = inFlight.get(id);
  if (existing?.fingerprint === fingerprint) return existing.task;
  const task = verifyProgramRuntimeItem(id).then((item) => {
    if (deploymentFingerprint(id) === fingerprint) evidenceCache.set(id, { fingerprint, item, storedAt: Date.now() });
    return item;
  }).finally(() => {
    if (inFlight.get(id)?.task === task) inFlight.delete(id);
  });
  inFlight.set(id, { fingerprint, task });
  return task;
}

export async function getProgramRuntimeItem(id: ProgramRuntimeId, options: { readonly force?: boolean } = {}): Promise<ProgramRuntimeItem> {
  const now = Date.now();
  const fingerprint = deploymentFingerprint(id);
  const cached = evidenceCache.get(id);
  if (cached && cached.fingerprint !== fingerprint) evidenceCache.delete(id);
  if (!options.force && cached?.fingerprint === fingerprint && now - cached.storedAt <= PROGRAM_EVIDENCE_CACHE_TTL_MS) {
    return { ...cached.item, evidenceMode: "cache", cacheAgeMs: Math.max(0, now - cached.storedAt) };
  }
  return freshProgramRuntimeItem(id, fingerprint);
}

export function summarizeProgramReadiness(programs: readonly ProgramRuntimeItem[]): ProgramReadinessPayload {
  const required = programs.filter((item) => item.requiredForCoreBridge);
  return {
    checkedAt: new Date().toISOString(),
    ready: required.length > 0 && required.every((item) => item.verified && item.executable),
    configuredCount: programs.filter((item) => item.configured).length,
    verifiedCount: programs.filter((item) => item.verified).length,
    requiredCount: required.length,
    requiredVerifiedCount: required.filter((item) => item.verified && item.executable).length,
    executableCount: programs.filter((item) => item.executable).length,
    unavailableCount: programs.filter((item) => item.state === "unavailable").length,
    timedOutCount: programs.filter((item) => item.timedOut).length,
    programs,
    authoritativeForSettlement: false,
  };
}

export async function getProgramReadiness(options: { readonly force?: boolean } = {}): Promise<ProgramReadinessPayload> {
  const programs = await Promise.all((PROTOCOL_PROGRAMS.map((item) => getProgramRuntimeItem(item.id as ProgramRuntimeId, options))));
  return summarizeProgramReadiness(programs);
}
