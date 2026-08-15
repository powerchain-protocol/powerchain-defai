import { randomUUID } from "node:crypto";
import bs58 from "bs58";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, createTransferCheckedInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { prisma } from "@powerchain/database/prisma";
import type { PrismaTransactionClient } from "@powerchain/database/prisma";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const PWRC_DECIMALS = 9;

function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_REQUIRED`);
  return value;
}

function connection() { return new Connection(env("POWERCHAIN_SOLANA_RPC_URL"), { commitment: "finalized" }); }
function claimMemo(id: string) { return `POWERCHAIN_CLAIM:${id}`; }

async function remoteSign(unsignedBase64: string, claimId: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(env("POWERCHAIN_CLAIM_SIGNER_URL"), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env("POWERCHAIN_CLAIM_SIGNER_TOKEN")}` },
      body: JSON.stringify({ purpose: "powerchain-claim", claimId, transactionBase64: unsignedBase64 }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`CLAIM_SIGNER_HTTP_${response.status}`);
    const body = await response.json() as { signedTransactionBase64?: unknown };
    if (typeof body.signedTransactionBase64 !== "string" || !body.signedTransactionBase64) throw new Error("CLAIM_SIGNER_BAD_RESPONSE");
    return Buffer.from(body.signedTransactionBase64, "base64");
  } finally { clearTimeout(timeout); }
}

export async function submitClaimPayout(claimId: string) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId } });
  if (!claim) throw new Error("CLAIM_NOT_FOUND");
  if (claim.status !== "SUBMITTING" || claim.sourceTx) return claim;
  if (claim.reservationExpiresAt.getTime() <= Date.now()) throw new Error("CLAIM_RESERVATION_EXPIRED");

  const mint = new PublicKey(env("POWERCHAIN_PWRC_SOLANA_MINT"));
  const treasuryOwner = new PublicKey(env("POWERCHAIN_CLAIM_TREASURY_OWNER"));
  const destinationOwner = new PublicKey(claim.wallet);
  const treasuryAta = getAssociatedTokenAddressSync(mint, treasuryOwner, true, TOKEN_2022_PROGRAM_ID);
  const destinationAta = getAssociatedTokenAddressSync(mint, destinationOwner, false, TOKEN_2022_PROGRAM_ID);
  const amount = BigInt(claim.amountBaseUnits.toFixed(0));
  if (amount <= 0n) throw new Error("CLAIM_AMOUNT_INVALID");

  const rpc = connection();
  const latest = await rpc.getLatestBlockhash("finalized");
  const tx = new Transaction({ feePayer: treasuryOwner, recentBlockhash: latest.blockhash });
  tx.add(createAssociatedTokenAccountIdempotentInstruction(treasuryOwner, destinationAta, destinationOwner, mint, TOKEN_2022_PROGRAM_ID));
  tx.add(new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: Buffer.from(claimMemo(claim.id), "utf8") }));
  tx.add(createTransferCheckedInstruction(treasuryAta, mint, destinationAta, treasuryOwner, amount, PWRC_DECIMALS, [], TOKEN_2022_PROGRAM_ID));

  const simulation = await rpc.simulateTransaction(tx, undefined, true);
  if (simulation.value.err) throw new Error("CLAIM_SIMULATION_FAILED");
  const unsigned = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
  const signedBytes = await remoteSign(unsigned, claim.id);
  const signed = Transaction.from(signedBytes);
  const signatureBytes = signed.signature;
  if (!signatureBytes) throw new Error("CLAIM_SIGNER_MISSING_SIGNATURE");
  const expectedSignature = bs58.encode(signatureBytes);

  try {
    const returned = await rpc.sendRawTransaction(signedBytes, { skipPreflight: false, maxRetries: 0 });
    if (returned !== expectedSignature) throw new Error("CLAIM_SIGNATURE_MISMATCH");
    return await prisma.claim.update({ where: { id: claim.id }, data: { status: "SUBMITTED", sourceTx: returned, nextRetryAt: new Date(Date.now() + 5_000), attemptCount: { increment: 1 }, workerLeaseOwner: null, workerLeaseUntil: null } });
  } catch (error) {
    await prisma.claim.update({ where: { id: claim.id }, data: { status: "UNKNOWN", sourceTx: expectedSignature, failureCode: error instanceof Error ? error.message.slice(0,160) : "CLAIM_SUBMISSION_UNKNOWN", workerLeaseOwner: null, workerLeaseUntil: null } });
    throw new Error("CLAIM_SUBMISSION_OUTCOME_UNKNOWN");
  }
}

function parsedInstructions(tx: NonNullable<Awaited<ReturnType<Connection["getParsedTransaction"]>>>) {
  const top = tx.transaction.message.instructions;
  const inner = tx.meta?.innerInstructions?.flatMap((row) => row.instructions) ?? [];
  return [...top, ...inner];
}

export async function verifyClaimPayout(claimId: string) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId } });
  if (!claim || !claim.sourceTx) throw new Error("CLAIM_SIGNATURE_UNAVAILABLE");
  const rpc = connection();
  const tx = await rpc.getParsedTransaction(claim.sourceTx, { commitment: "finalized", maxSupportedTransactionVersion: 0 });
  if (!tx) return { finalized: false as const };
  if (tx.meta?.err) throw new Error("CLAIM_TRANSACTION_FAILED");
  const mint = new PublicKey(env("POWERCHAIN_PWRC_SOLANA_MINT"));
  const owner = new PublicKey(claim.wallet);
  const destinationAta = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID).toBase58();
  const amount = claim.amountBaseUnits.toFixed(0);
  let memoOk = false;
  let transferOk = false;
  for (const instruction of parsedInstructions(tx)) {
    if ("programId" in instruction && instruction.programId.toBase58() === MEMO_PROGRAM_ID.toBase58()) {
      const parsed = "parsed" in instruction ? instruction.parsed : null;
      const memo = typeof parsed === "string" ? parsed : parsed && typeof parsed === "object" && "memo" in parsed ? String((parsed as { memo?: unknown }).memo ?? "") : "";
      if (memo === claimMemo(claim.id)) memoOk = true;
    }
    if ("parsed" in instruction && instruction.parsed && typeof instruction.parsed === "object") {
      const parsed = instruction.parsed as { type?: unknown; info?: Record<string, unknown> };
      if (parsed.type !== "transferChecked") continue;
      const info = parsed.info ?? {};
      const tokenAmount = info.tokenAmount as { amount?: unknown; decimals?: unknown } | undefined;
      if (String(info.mint ?? "") === mint.toBase58() && String(info.destination ?? "") === destinationAta && String(tokenAmount?.amount ?? "") === amount && Number(tokenAmount?.decimals) === PWRC_DECIMALS) transferOk = true;
    }
  }
  if (!memoOk || !transferOk) throw new Error(!memoOk ? "CLAIM_MEMO_MISMATCH" : "CLAIM_TRANSFER_MISMATCH");
  return { finalized: true as const, signature: claim.sourceTx, slot: tx.slot };
}

export async function finalizeClaimPayout(claimId: string) {
  const evidence = await verifyClaimPayout(claimId);
  if (!evidence.finalized) return null;
  return prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const claim = await tx.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new Error("CLAIM_NOT_FOUND");
    if (claim.status === "FINALIZED") return claim;
    const finalizedAt = new Date();
    const updated = await tx.claim.update({ where: { id: claim.id }, data: { status: "FINALIZED", finalizedAt, nextRetryAt: null, failureCode: null, workerLeaseOwner: null, workerLeaseUntil: null } });
    await tx.claimAllocation.updateMany({ where: { wallet: claim.wallet, reservedByClaimId: claim.id }, data: { claimedAt: finalizedAt, reservedByClaimId: null, reservedUntil: null } });
    await tx.bridgeAuditEvent.create({ data: { id: randomUUID(), event: "claim.finalized", actor: "claim-worker", target: claim.id, payload: { signature: evidence.signature, slot: evidence.slot, amountBaseUnits: claim.amountBaseUnits.toFixed(0) } } });
    return updated;
  }, { isolationLevel: "Serializable" });
}
