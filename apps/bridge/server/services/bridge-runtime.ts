import "server-only";

import { createHash } from "node:crypto";
import { checkProviderReadiness } from "./provider-health";
import { checkPwrcAssetIntegrity } from "./asset-integrity";
import { getTokenInformation } from "./token-information";

export type BridgeRuntimeStatus = "ready" | "degraded" | "blocked";
export type BridgeRuntimeCapability = "quote" | "wallet-signature" | "transfer-submit" | "claim" | "status-tracking";

export type BridgeRuntimeCheck = {
  id: "solana-finalized" | "sui-checkpoint" | "provider-redundancy" | "asset-integrity" | "information-commitment";
  ok: boolean;
  blocking: boolean;
  detail?: string;
};

const DEFAULT_RUNTIME_TTL_MS = 20_000;
const MIN_RUNTIME_TTL_MS = 5_000;
const MAX_RUNTIME_TTL_MS = 60_000;

function runtimeTtlMs() {
  const raw = Number(process.env.POWERCHAIN_BRIDGE_RUNTIME_TTL_MS ?? DEFAULT_RUNTIME_TTL_MS);
  if (!Number.isFinite(raw)) return DEFAULT_RUNTIME_TTL_MS;
  return Math.min(MAX_RUNTIME_TTL_MS, Math.max(MIN_RUNTIME_TTL_MS, Math.trunc(raw)));
}

function settledError(reason: unknown) {
  return reason instanceof Error ? reason.name : "Unavailable";
}

function stableFingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function checkBridgeRuntime() {
  const observedAt = new Date();
  const [readinessResult, integrityResult] = await Promise.allSettled([
    checkProviderReadiness(),
    checkPwrcAssetIntegrity(),
  ]);

  const readiness = readinessResult.status === "fulfilled" ? readinessResult.value : null;
  const integrity = integrityResult.status === "fulfilled" ? integrityResult.value : null;

  const solana = readiness?.providers.find((provider) => provider.provider === "solana");
  const sui = readiness?.providers.find((provider) => provider.provider === "sui");
  const redundancyReduced = Boolean(readiness?.providers.some((provider) => provider.redundancy !== "full"));

  const information = getTokenInformation();

  const checks: BridgeRuntimeCheck[] = [
    {
      id: "solana-finalized",
      ok: Boolean(solana?.ready),
      blocking: true,
      detail: solana?.ready ? `finalized head ${solana.head ?? "available"}` : readinessResult.status === "rejected" ? settledError(readinessResult.reason) : "fresh finalized Solana head unavailable",
    },
    {
      id: "sui-checkpoint",
      ok: Boolean(sui?.ready),
      blocking: true,
      detail: sui?.ready ? `checkpoint ${sui.head ?? "available"}` : readinessResult.status === "rejected" ? settledError(readinessResult.reason) : "fresh Sui checkpoint unavailable",
    },
    {
      id: "provider-redundancy",
      ok: Boolean(readiness?.ready) && !redundancyReduced,
      blocking: false,
      detail: readiness?.ready ? (redundancyReduced ? "one or more chains are operating with reduced provider redundancy" : "independent primary and fallback providers available") : "provider readiness unavailable",
    },
    {
      id: "asset-integrity",
      ok: Boolean(integrity?.healthy),
      blocking: true,
      detail: integrity?.healthy ? `PWRC asset fingerprint ${integrity.assetFingerprint}` : integrityResult.status === "rejected" ? settledError(integrityResult.reason) : "PWRC/wPWRC asset integrity check failed",
    },
    {
      id: "information-commitment",
      ok: information.runtime.verification.runtimeVerified,
      blocking: true,
      detail: information.runtime.verification.runtimeVerified
        ? `token information ${information.informationCommitment.digest}`
        : `token information verification failed: ${information.runtime.verification.failures.join(", ")}`,
    },
  ];

  const blocked = checks.some((check) => check.blocking && !check.ok);
  const degraded = !blocked && (redundancyReduced || Boolean(readiness?.degraded));
  const status: BridgeRuntimeStatus = blocked ? "blocked" : degraded ? "degraded" : "ready";
  const capabilities = {
    quote: !blocked,
    "wallet-signature": !blocked,
    "transfer-submit": !blocked,
    claim: !blocked,
    // Existing transfers must remain observable during provider or asset incidents.
    "status-tracking": true,
  } as const;

  const identity = {
    status,
    capabilities,
    checks: checks.map(({ id, ok, blocking }) => ({ id, ok, blocking })),
    solanaHead: solana?.head ?? null,
    suiHead: sui?.head ?? null,
    assetFingerprint: integrity?.assetFingerprint ?? null,
    informationCommitment: information.informationCommitment.digest,
    informationVerified: information.runtime.verification.runtimeVerified,
  };
  const snapshotId = stableFingerprint(identity);
  const checkedAt = observedAt.toISOString();
  const validUntil = new Date(observedAt.getTime() + runtimeTtlMs()).toISOString();

  return {
    status,
    capabilities,
    canRequestQuote: capabilities.quote,
    canOpenWalletSignature: capabilities["wallet-signature"],
    canSubmitTransfer: capabilities["transfer-submit"],
    canClaim: capabilities.claim,
    canTrackStatus: capabilities["status-tracking"],
    snapshotId,
    checkedAt,
    validUntil,
    checks,
    providerReadiness: readiness
      ? {
          ready: readiness.ready,
          degraded: readiness.degraded,
          providers: readiness.providers.map((provider) => ({
            provider: provider.provider,
            ready: provider.ready,
            redundancy: provider.redundancy,
            head: provider.head,
            latencyMs: provider.latencyMs,
          })),
        }
      : null,
    tokenInformation: { commitment: information.informationCommitment.digest, verified: information.runtime.verification.runtimeVerified, failures: information.runtime.verification.failures },
    assetIntegrity: integrity
      ? {
          healthy: integrity.healthy,
          fingerprint: integrity.assetFingerprint,
          pinned: integrity.fingerprintPinned,
        }
      : null,
    authoritativeForBridgeAccounting: false as const,
  };
}

export async function requireBridgeRuntimeCapability(capability: BridgeRuntimeCapability) {
  const runtime = await checkBridgeRuntime();
  return {
    allowed: runtime.capabilities[capability],
    capability,
    runtime,
  } as const;
}
