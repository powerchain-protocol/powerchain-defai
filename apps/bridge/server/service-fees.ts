import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { prisma } from "@powerchain/database/prisma";

export type FeeChain = "SOLANA" | "SUI";

export interface ServiceFeePolicyInput {
  routeId: string;
  sourceChain: FeeChain;
  assetId: string;
  feeBps: number;
  recipient: string;
  enabled?: boolean;
  minFeeBaseUnits?: string | null;
  maxFeeBaseUnits?: string | null;
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((key) => `${JSON.stringify(key)}:${canonical(obj[key])}`).join(",")}}`;
}

function hashPayload(value: unknown): string {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function baseUnitsOrNull(value: unknown, code: string): string | null {
  if (value == null || value === "") return null;
  const text = String(value);
  if (!/^(0|[1-9][0-9]*)$/.test(text)) throw new Error(code);
  return text;
}

function validateRecipient(chain: FeeChain, recipient: string): string {
  const value = recipient.trim();
  if (chain === "SOLANA") return new PublicKey(value).toBase58();
  return normalizeSuiAddress(value);
}

export function validateServiceFeePolicyInput(raw: unknown): ServiceFeePolicyInput {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("SERVICE_FEE_POLICY_INVALID");
  const input = raw as Record<string, unknown>;
  const routeId = String(input.routeId ?? "").trim();
  const sourceChain = String(input.sourceChain ?? "").toUpperCase() as FeeChain;
  const assetId = String(input.assetId ?? "").trim();
  const feeBps = Number(input.feeBps);
  if (!routeId) throw new Error("SERVICE_FEE_ROUTE_REQUIRED");
  if (sourceChain !== "SOLANA" && sourceChain !== "SUI") throw new Error("SERVICE_FEE_CHAIN_INVALID");
  if (!assetId) throw new Error("SERVICE_FEE_ASSET_REQUIRED");
  const maxBps = Number(process.env.POWERCHAIN_SERVICE_FEE_MAX_BPS ?? 1000);
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > maxBps) throw new Error("SERVICE_FEE_BPS_OUT_OF_RANGE");
  const recipient = validateRecipient(sourceChain, String(input.recipient ?? ""));
  const minFeeBaseUnits = baseUnitsOrNull(input.minFeeBaseUnits, "SERVICE_FEE_MIN_INVALID");
  const maxFeeBaseUnits = baseUnitsOrNull(input.maxFeeBaseUnits, "SERVICE_FEE_MAX_INVALID");
  if (minFeeBaseUnits != null && maxFeeBaseUnits != null && BigInt(minFeeBaseUnits) > BigInt(maxFeeBaseUnits)) throw new Error("SERVICE_FEE_MIN_EXCEEDS_MAX");
  return { routeId, sourceChain, assetId, feeBps, recipient, enabled: input.enabled !== false, minFeeBaseUnits, maxFeeBaseUnits };
}

export async function createServiceFeePolicyProposal(input: {
  payload: ServiceFeePolicyInput;
  proposedBy: string;
  requestId: string;
  idempotencyKey?: string | null;
}) {
  const payloadHash = hashPayload(input.payload);
  const idempotencyKey = input.idempotencyKey?.trim() || null;
  if (idempotencyKey) {
    const existing = await prisma.bridgeGovernanceProposal.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (existing.kind !== "SERVICE_FEE_POLICY_UPDATE" || existing.payloadHash !== payloadHash) throw new Error("GOVERNANCE_IDEMPOTENCY_KEY_REUSED");
      return existing;
    }
  }
  const expiresAt = new Date(Date.now() + 24 * 60 * 60_000);
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.bridgeGovernanceProposal.create({ data: {
      id: randomUUID(), kind: "SERVICE_FEE_POLICY_UPDATE", status: "PENDING", payload: input.payload as any,
      payloadHash, idempotencyKey, proposedBy: input.proposedBy, requestId: input.requestId, expiresAt,
    }});
    await tx.bridgeAuditEvent.create({ data: {
      id: randomUUID(), event: "service-fee.policy.proposed", actor: input.proposedBy, target: proposal.id,
      payload: { requestId: input.requestId, payloadHash, routeId: input.payload.routeId, sourceChain: input.payload.sourceChain, feeBps: input.payload.feeBps, recipient: input.payload.recipient },
    }});
    return proposal;
  });
}

async function lockFeeProposal(tx: any, id: string) {
  await tx.$queryRawUnsafe('SELECT id FROM bridge_governance_proposals WHERE id = $1 FOR UPDATE', id);
  return tx.bridgeGovernanceProposal.findUnique({ where: { id } });
}

export async function applyServiceFeePolicyProposal(input: { id: string; approvedBy: string; requestId: string }) {
  return prisma.$transaction(async (tx: any) => {
    const proposal = await lockFeeProposal(tx, input.id);
    if (!proposal) throw new Error("GOVERNANCE_PROPOSAL_NOT_FOUND");
    if (proposal.kind !== "SERVICE_FEE_POLICY_UPDATE") throw new Error("GOVERNANCE_PROPOSAL_KIND_MISMATCH");
    if (proposal.status !== "PENDING") throw new Error(`GOVERNANCE_PROPOSAL_${proposal.status}`);
    if (proposal.expiresAt.getTime() <= Date.now()) {
      await tx.bridgeGovernanceProposal.update({ where: { id: proposal.id }, data: { status: "EXPIRED" } });
      throw new Error("GOVERNANCE_PROPOSAL_EXPIRED");
    }
    if (process.env.NODE_ENV === "production" && proposal.proposedBy === input.approvedBy) throw new Error("GOVERNANCE_DUAL_CONTROL_REQUIRED");
    const payload = validateServiceFeePolicyInput(proposal.payload);
    const current = await tx.bridgeServiceFeePolicy.findFirst({ where: { routeId: payload.routeId, sourceChain: payload.sourceChain }, orderBy: { version: "desc" } });
    const version = (current?.version ?? 0) + 1;
    await tx.bridgeServiceFeePolicy.updateMany({ where: { routeId: payload.routeId, sourceChain: payload.sourceChain, enabled: true }, data: { enabled: false, disabledAt: new Date() } });
    const effectiveFrom = new Date();
    const policyCommitment = hashPayload({
      routeId: payload.routeId, sourceChain: payload.sourceChain, assetId: payload.assetId,
      feeBps: payload.feeBps, recipient: payload.recipient, enabled: payload.enabled !== false, version,
      minFeeBaseUnits: payload.minFeeBaseUnits, maxFeeBaseUnits: payload.maxFeeBaseUnits,
      effectiveFrom: effectiveFrom.toISOString(), proposalId: proposal.id,
    });
    const policy = await tx.bridgeServiceFeePolicy.create({ data: {
      id: randomUUID(), routeId: payload.routeId, sourceChain: payload.sourceChain, assetId: payload.assetId,
      feeBps: payload.feeBps, recipient: payload.recipient, enabled: payload.enabled !== false, version,
      minFeeBaseUnits: payload.minFeeBaseUnits, maxFeeBaseUnits: payload.maxFeeBaseUnits,
      effectiveFrom, createdBy: input.approvedBy, proposalId: proposal.id, policyCommitment,
    }});
    await tx.bridgeGovernanceProposal.update({ where: { id: proposal.id }, data: { status: "APPLIED", approvedBy: input.approvedBy, appliedAt: new Date() } });
    await tx.bridgeAuditEvent.create({ data: {
      id: randomUUID(), event: "service-fee.policy.applied", actor: input.approvedBy, target: policy.id,
      payload: { proposalId: proposal.id, requestId: input.requestId, routeId: policy.routeId, sourceChain: policy.sourceChain, feeBps: policy.feeBps, recipient: policy.recipient, version, policyCommitment },
    }});
    return policy;
  }, { isolationLevel: "Serializable" });
}

export async function rejectServiceFeePolicyProposal(input: { id: string; approvedBy: string; requestId: string; reason?: string }) {
  return prisma.$transaction(async (tx: any) => {
    const proposal = await lockFeeProposal(tx, input.id);
    if (!proposal) throw new Error("GOVERNANCE_PROPOSAL_NOT_FOUND");
    if (proposal.kind !== "SERVICE_FEE_POLICY_UPDATE") throw new Error("GOVERNANCE_PROPOSAL_KIND_MISMATCH");
    if (proposal.status !== "PENDING") throw new Error(`GOVERNANCE_PROPOSAL_${proposal.status}`);
    const rejected = await tx.bridgeGovernanceProposal.update({ where: { id: proposal.id }, data: { status: "REJECTED", approvedBy: input.approvedBy } });
    await tx.bridgeAuditEvent.create({ data: { id: randomUUID(), event: "service-fee.policy.rejected", actor: input.approvedBy, target: proposal.id, payload: { requestId: input.requestId, reason: input.reason?.slice(0, 500) ?? null } } });
    return rejected;
  }, { isolationLevel: "Serializable" });
}

export async function serviceFeeSummary() {
  const [policies, grouped, recent] = await Promise.all([
    prisma.bridgeServiceFeePolicy.findMany({ orderBy: [{ routeId: "asc" }, { sourceChain: "asc" }, { version: "desc" }] }),
    prisma.bridgeServiceFeeSettlement.groupBy({ by: ["sourceChain", "assetId", "status"], _sum: { feeBaseUnits: true }, _count: { _all: true } }),
    prisma.bridgeServiceFeeSettlement.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
  ]);
  return { policies, grouped, recent };
}

export async function listServiceFeePolicyHistory(input: { routeId?: string; sourceChain?: FeeChain; limit?: number }) {
  const limit = Math.max(1, Math.min(200, input.limit ?? 100));
  const policies = await prisma.bridgeServiceFeePolicy.findMany({
    where: { ...(input.routeId ? { routeId: input.routeId } : {}), ...(input.sourceChain ? { sourceChain: input.sourceChain } : {}) },
    orderBy: [{ routeId: "asc" }, { sourceChain: "asc" }, { version: "desc" }],
    take: limit,
  });
  return policies.map((row) => ({
    id: row.id, routeId: row.routeId, sourceChain: row.sourceChain, assetId: row.assetId, feeBps: row.feeBps, recipient: row.recipient,
    enabled: row.enabled, version: row.version, minFeeBaseUnits: row.minFeeBaseUnits?.toFixed(0) ?? null, maxFeeBaseUnits: row.maxFeeBaseUnits?.toFixed(0) ?? null,
    effectiveFrom: row.effectiveFrom.toISOString(), disabledAt: row.disabledAt?.toISOString() ?? null, createdBy: row.createdBy, proposalId: row.proposalId, policyCommitment: row.policyCommitment,
  }));
}
