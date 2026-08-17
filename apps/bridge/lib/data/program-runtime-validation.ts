import type { ProgramReadinessPayload, ProgramRuntimeItem } from "@/types/programs";

function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
const STATES = new Set(["verified","verification-required","unconfigured","gated","unavailable"]);
const CHAINS = new Set(["solana","sui"]);
const KINDS = new Set(["bridge","staking","escrow"]);
const SOURCES = new Set(["solana-rpc","sui-rpc","staking-verifier","escrow-verifier","repository","operator-config","runtime-verifier"]);
const MODES = new Set(["live","cache"]);

function isDeploymentEvidence(value: unknown): boolean {
  if (!record(value) || typeof value.kind !== "string") return false;
  if (value.kind === "solana-loader") {
    return typeof value.accountOwner === "string" && ["bpf-loader-v1","bpf-loader-v2","bpf-upgradeable","loader-v4"].includes(String(value.loader));
  }
  if (value.kind === "sui-shared-objects") return typeof value.configShared === "boolean" && typeof value.informationShared === "boolean";
  return false;
}

export function isProgramRuntimeItem(value: unknown): value is ProgramRuntimeItem {
  if (!record(value)) return false;
  return typeof value.id === "string" && typeof value.label === "string" && CHAINS.has(String(value.chain)) && KINDS.has(String(value.kind)) &&
    typeof value.sourcePath === "string" && typeof value.purpose === "string" && typeof value.configured === "boolean" && typeof value.verified === "boolean" &&
    typeof value.executable === "boolean" && typeof value.timedOut === "boolean" && typeof value.requiredForCoreBridge === "boolean" && typeof value.checkedAt === "string" && typeof value.verificationDurationMs === "number" && Number.isFinite(value.verificationDurationMs) && value.verificationDurationMs >= 0 && typeof value.cacheAgeMs === "number" && Number.isFinite(value.cacheAgeMs) && value.cacheAgeMs >= 0 &&
    (value.configVersion === undefined || (typeof value.configVersion === "number" && Number.isInteger(value.configVersion) && value.configVersion > 0)) &&
    STATES.has(String(value.state)) && SOURCES.has(String(value.evidenceSource)) && MODES.has(String(value.evidenceMode)) &&
    (value.deploymentEvidence === undefined || isDeploymentEvidence(value.deploymentEvidence));
}

export function isProgramReadinessPayload(value: unknown): value is ProgramReadinessPayload {
  return record(value) && typeof value.checkedAt === "string" && typeof value.ready === "boolean" && typeof value.configuredCount === "number" &&
    typeof value.verifiedCount === "number" && typeof value.requiredCount === "number" && typeof value.requiredVerifiedCount === "number" &&
    typeof value.executableCount === "number" && typeof value.unavailableCount === "number" && typeof value.timedOutCount === "number" && value.authoritativeForSettlement === false && Array.isArray(value.programs) && value.programs.every(isProgramRuntimeItem);
}
