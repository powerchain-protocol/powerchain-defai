import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { retrySerializableTransaction } from "@powerchain/database";
import { prisma } from "@powerchain/database/prisma";
import type { PrismaTransactionClient } from "@powerchain/database/prisma";

const CHALLENGE_TTL_MS = 5 * 60_000;
const RESERVATION_TTL_MS = 10 * 60_000;

function walletAddress(value: unknown) {
  if (typeof value !== "string" || !value.trim()) throw new Error("WALLET_REQUIRED");
  return new PublicKey(value.trim()).toBase58();
}

function decimalText(value: { toFixed: (digits?: number) => string } | string | number | bigint) {
  return typeof value === "object" ? value.toFixed(0) : String(value);
}

export async function getClaimEligibility(walletRaw: unknown) {
  const wallet = walletAddress(walletRaw);
  const [allocation, active, finalized] = await Promise.all([
    prisma.claimAllocation.findUnique({ where: { wallet } }),
    prisma.claim.findFirst({ where: { wallet, status: { in: ["RESERVED", "SUBMITTING", "SUBMITTED", "UNKNOWN"] } }, orderBy: { createdAt: "desc" } }),
    prisma.claim.findFirst({ where: { wallet, status: "FINALIZED" }, orderBy: { finalizedAt: "desc" } }),
  ]);
  if (!allocation || !allocation.enabled) return { wallet, status: "NOT_ELIGIBLE" as const, claimableBaseUnits: "0", asset: "PWRC" as const, decimals: 9, challengeRequired: false };
  if (allocation.claimedAt || finalized) return { wallet, status: "ALREADY_CLAIMED" as const, claimableBaseUnits: "0", asset: "PWRC" as const, decimals: 9, challengeRequired: false, claimId: finalized?.id ?? allocation.reservedByClaimId ?? null };
  if (active) return { wallet, status: active.status, claimableBaseUnits: decimalText(active.amountBaseUnits), asset: "PWRC" as const, decimals: 9, challengeRequired: false, claimId: active.id, reservationExpiresAt: active.reservationExpiresAt.toISOString() };
  return { wallet, status: "ELIGIBLE" as const, claimableBaseUnits: decimalText(allocation.amountBaseUnits), asset: "PWRC" as const, decimals: 9, challengeRequired: true };
}

export async function createClaimChallenge(walletRaw: unknown) {
  const eligibility = await getClaimEligibility(walletRaw);
  if (eligibility.status !== "ELIGIBLE") throw new Error(`CLAIM_${eligibility.status}`);
  const nonce = randomBytes(32).toString("base64url");
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  const message = [
    "POWERCHAIN_CLAIM_AUTH_V1",
    `wallet:${eligibility.wallet}`,
    `challenge:${id}`,
    `nonce:${nonce}`,
    `expires:${expiresAt.toISOString()}`,
  ].join("\n");
  await prisma.claimChallenge.create({ data: { id, wallet: eligibility.wallet, message, nonceHash: createHash("sha256").update(nonce).digest("hex"), expiresAt } });
  return { challengeId: id, wallet: eligibility.wallet, message, expiresAt: expiresAt.toISOString() };
}

export async function reserveClaim(input: { raw: unknown; idempotencyKey: string }) {
  if (!input.raw || typeof input.raw !== "object" || Array.isArray(input.raw)) throw new Error("INVALID_CLAIM_RESERVE_REQUEST");
  const body = input.raw as Record<string, unknown>;
  const wallet = walletAddress(body.wallet);
  const challengeId = String(body.challengeId ?? "").trim();
  const signatureText = String(body.signature ?? "").trim();
  if (!challengeId || !signatureText) throw new Error("CLAIM_PROOF_REQUIRED");

  const challenge = await prisma.claimChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge || challenge.wallet !== wallet || challenge.consumedAt || challenge.expiresAt.getTime() <= Date.now()) throw new Error("CLAIM_CHALLENGE_INVALID");
  let signature: Uint8Array;
  try { signature = bs58.decode(signatureText); } catch { throw new Error("CLAIM_SIGNATURE_INVALID"); }
  const valid = nacl.sign.detached.verify(new TextEncoder().encode(challenge.message), signature, new PublicKey(wallet).toBytes());
  if (!valid) throw new Error("CLAIM_SIGNATURE_INVALID");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESERVATION_TTL_MS);
  const claimId = randomUUID();
  return retrySerializableTransaction(() => prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const existingByKey = await tx.claim.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existingByKey) {
      if (existingByKey.wallet !== wallet) throw new Error("CLAIM_IDEMPOTENCY_KEY_REUSED");
      return existingByKey;
    }
    const consumed = await tx.claimChallenge.updateMany({ where: { id: challengeId, wallet, consumedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now } });
    if (consumed.count !== 1) throw new Error("CLAIM_CHALLENGE_ALREADY_USED");
    const allocation = await tx.claimAllocation.findUnique({ where: { wallet } });
    if (!allocation || !allocation.enabled || allocation.claimedAt) throw new Error("CLAIM_NOT_ELIGIBLE");
    const locked = await tx.claimAllocation.updateMany({
      where: { wallet, enabled: true, claimedAt: null, OR: [{ reservedUntil: null }, { reservedUntil: { lt: now } }] },
      data: { reservedByClaimId: claimId, reservedUntil: expiresAt },
    });
    if (locked.count !== 1) {
      const current = await tx.claim.findFirst({ where: { wallet, status: { in: ["RESERVED", "SUBMITTING", "SUBMITTED", "UNKNOWN"] } }, orderBy: { createdAt: "desc" } });
      if (current) return current;
      throw new Error("CLAIM_ALREADY_RESERVED");
    }
    return tx.claim.create({ data: {
      id: claimId,
      wallet,
      allocationBaseUnits: allocation.amountBaseUnits,
      amountBaseUnits: allocation.amountBaseUnits,
      idempotencyKey: input.idempotencyKey,
      status: "RESERVED",
      reservationExpiresAt: expiresAt,
    }});
  }, { isolationLevel: "Serializable" }));
}

export async function submitReservedClaim(input: { raw: unknown; idempotencyKey: string }) {
  if (!input.raw || typeof input.raw !== "object" || Array.isArray(input.raw)) throw new Error("INVALID_CLAIM_SUBMIT_REQUEST");
  const body = input.raw as Record<string, unknown>;
  const claimId = String(body.claimId ?? "").trim();
  const wallet = walletAddress(body.wallet);
  if (!claimId) throw new Error("CLAIM_ID_REQUIRED");
  const now = new Date();
  return retrySerializableTransaction(() => prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const claim = await tx.claim.findUnique({ where: { id: claimId } });
    if (!claim || claim.wallet !== wallet) throw new Error("CLAIM_NOT_FOUND");
    if (claim.submitIdempotencyKey && claim.submitIdempotencyKey !== input.idempotencyKey) throw new Error("CLAIM_SUBMIT_IDEMPOTENCY_KEY_REUSED");
    if (["SUBMITTING", "SUBMITTED", "FINALIZED", "UNKNOWN"].includes(claim.status)) {
      if (!claim.submitIdempotencyKey) return tx.claim.update({ where: { id: claim.id }, data: { submitIdempotencyKey: input.idempotencyKey } });
      return claim;
    }
    if (claim.status !== "RESERVED") throw new Error(`CLAIM_${claim.status}`);
    if (claim.reservationExpiresAt.getTime() <= now.getTime()) {
      await tx.claim.update({ where: { id: claim.id }, data: { status: "EXPIRED", failureCode: "RESERVATION_EXPIRED" } });
      await tx.claimAllocation.updateMany({ where: { wallet, reservedByClaimId: claim.id, claimedAt: null }, data: { reservedByClaimId: null, reservedUntil: null } });
      throw new Error("CLAIM_RESERVATION_EXPIRED");
    }
    return tx.claim.update({ where: { id: claim.id }, data: { status: "SUBMITTING", nextRetryAt: now, submitIdempotencyKey: input.idempotencyKey } });
  }, { isolationLevel: "Serializable" }));
}

export async function getClaim(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("INVALID_CLAIM_ID");
  const claim = await prisma.claim.findUnique({ where: { id } });
  if (!claim) throw new Error("CLAIM_NOT_FOUND");
  return claim;
}
