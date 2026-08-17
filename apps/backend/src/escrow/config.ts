import { createHash } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import { solanaRpcUrls } from "../services/rpc";

export const ESCROW_SOURCE_PLACEHOLDER_PROGRAM_ID = "8AQLAvN5gcV1nbWoEfaPqnorsqJLPjmvEFeZBHkWCKBw" as const;
export const ESCROW_CONFIG_VERSION = 1 as const;
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as const;
export const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" as const;

const RPC_TIMEOUT_MS = 5_000;
const ZERO_PUBKEY = "11111111111111111111111111111111";

export type EscrowVerificationStatus = "verified" | "unverified" | "unavailable" | "invalid";
export type EscrowVerificationEvidence = {
  status: EscrowVerificationStatus;
  source: "operator-config" | "solana-rpc" | "repository";
  detail: string;
  checkedAt?: string;
  endpointIndex?: number;
};

export type EscrowRuntimeStatus = {
  configured: boolean;
  verified: boolean;
  executable: boolean;
  programId?: string;
  reason?: string;
  evidence: EscrowVerificationEvidence;
  connectedWalletSigns: true;
  backendCustody: false;
};

export type EscrowCheckoutEvidence = {
  verified: true;
  checkedAt: string;
  endpointIndex: number;
  programId: string;
  escrow: string;
  mint: string;
  tokenProgramId: typeof TOKEN_PROGRAM_ID | typeof TOKEN_2022_PROGRAM_ID;
  allowedMint: string;
  extensions: string;
  vault: string;
  escrowImmutable: boolean;
  extensionsImmutable: boolean;
  timelockSlots: string;
  hookProgram?: string;
};

type RpcAccountValue = { data?: unknown; executable?: boolean; owner?: string };
type RpcAccountInfo = { error?: { code?: number; message?: string }; result?: { value?: RpcAccountValue | null } };

function evidence(status: EscrowVerificationStatus, source: EscrowVerificationEvidence["source"], detail: string, checkedAt?: string, endpointIndex?: number): EscrowVerificationEvidence {
  return {
    status,
    source,
    detail,
    ...(checkedAt === undefined ? {} : { checkedAt }),
    ...(endpointIndex === undefined ? {} : { endpointIndex }),
  };
}

function publicKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try { return new PublicKey(value).toBase58(); } catch { return undefined; }
}

function requirePublicKey(value: string | undefined, code: string): string {
  const parsed = publicKey(value);
  if (!parsed) throw new Error(code);
  return parsed;
}

function accountDiscriminator(name: string): Buffer {
  return createHash("sha256").update(`account:${name}`).digest().subarray(0, 8);
}

function accountBytes(value: RpcAccountValue, expectedOwner: string, accountName: string): Buffer {
  if (value.owner !== expectedOwner) throw new Error(`ESCROW_${accountName.toUpperCase()}_OWNER_MISMATCH`);
  if (!Array.isArray(value.data) || typeof value.data[0] !== "string") throw new Error(`ESCROW_${accountName.toUpperCase()}_DATA_INVALID`);
  const bytes = Buffer.from(value.data[0], "base64");
  const discriminator = accountDiscriminator(accountName);
  if (bytes.length < 8 || !bytes.subarray(0, 8).equals(discriminator)) throw new Error(`ESCROW_${accountName.toUpperCase()}_DISCRIMINATOR_MISMATCH`);
  return bytes;
}

function readPublicKey(bytes: Buffer, offset: number): string {
  if (offset + 32 > bytes.length) throw new Error("ESCROW_ACCOUNT_TRUNCATED");
  return new PublicKey(bytes.subarray(offset, offset + 32)).toBase58();
}

function readU64(bytes: Buffer, offset: number): bigint {
  if (offset + 8 > bytes.length) throw new Error("ESCROW_ACCOUNT_TRUNCATED");
  return bytes.readBigUInt64LE(offset);
}

function readU16(bytes: Buffer, offset: number): number {
  if (offset + 2 > bytes.length) throw new Error("ESCROW_ACCOUNT_TRUNCATED");
  return bytes.readUInt16LE(offset);
}

function decodeEscrow(bytes: Buffer) {
  if (bytes.length < 76) throw new Error("ESCROW_ACCOUNT_TRUNCATED");
  let offset = 8;
  const admin = readPublicKey(bytes, offset); offset += 32;
  const escrowSeed = bytes.subarray(offset, offset + 32); offset += 32;
  const immutable = bytes[offset] === 1; offset += 1;
  const bump = bytes[offset] ?? 0; offset += 1;
  const version = readU16(bytes, offset);
  return { admin, escrowSeed, immutable, bump, version };
}

function decodeAllowedMint(bytes: Buffer) {
  if (bytes.length < 76) throw new Error("ESCROW_ALLOWED_MINT_TRUNCATED");
  let offset = 8;
  const escrow = readPublicKey(bytes, offset); offset += 32;
  const mint = readPublicKey(bytes, offset); offset += 32;
  const allowed = bytes[offset] === 1; offset += 1;
  const bump = bytes[offset] ?? 0; offset += 1;
  const version = readU16(bytes, offset);
  return { escrow, mint, allowed, bump, version };
}

function decodeExtensions(bytes: Buffer) {
  if (bytes.length < 88) throw new Error("ESCROW_EXTENSIONS_TRUNCATED");
  let offset = 8;
  const escrow = readPublicKey(bytes, offset); offset += 32;
  const timelockSlots = readU64(bytes, offset); offset += 8;
  const hookProgram = readPublicKey(bytes, offset); offset += 32;
  const blockPermanentDelegate = bytes[offset] === 1; offset += 1;
  const blockNonTransferable = bytes[offset] === 1; offset += 1;
  const blockPausable = bytes[offset] === 1; offset += 1;
  const blockTransferHook = bytes[offset] === 1; offset += 1;
  const immutable = bytes[offset] === 1; offset += 1;
  const bump = bytes[offset] ?? 0; offset += 1;
  const version = readU16(bytes, offset);
  return { escrow, timelockSlots, hookProgram, blockPermanentDelegate, blockNonTransferable, blockPausable, blockTransferHook, immutable, bump, version };
}

async function rpcAccountInfo(rpcUrl: string, address: string, parentSignal?: AbortSignal): Promise<RpcAccountValue | null> {
  const controller = new AbortController();
  const abortFromParent = () => controller.abort(parentSignal?.reason);
  parentSignal?.addEventListener("abort", abortFromParent, { once: true });
  if (parentSignal?.aborted) controller.abort(parentSignal.reason);
  const timeout = setTimeout(() => controller.abort(new Error("ESCROW_RPC_TIMEOUT")), RPC_TIMEOUT_MS);
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "powerchain-escrow-verification", method: "getAccountInfo", params: [address, { encoding: "base64", commitment: "confirmed" }] }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`ESCROW_RPC_HTTP_${response.status}`);
    const payload = await response.json() as RpcAccountInfo;
    if (payload.error) throw new Error(`ESCROW_RPC_${payload.error.code ?? "ERROR"}:${payload.error.message ?? "unknown"}`);
    return payload.result?.value ?? null;
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
}

function configuredStatus(): EscrowRuntimeStatus {
  const raw = process.env.POWERCHAIN_SOLANA_ESCROW_PROGRAM_ID?.trim();
  const programId = publicKey(raw);
  if (!raw) return { configured: false, verified: false, executable: false, reason: "ESCROW_PROGRAM_ID_REQUIRED", evidence: evidence("unverified", "operator-config", "Escrow program ID is not configured."), connectedWalletSigns: true, backendCustody: false };
  if (!programId) return { configured: true, verified: false, executable: false, reason: "ESCROW_PROGRAM_ID_INVALID", evidence: evidence("invalid", "operator-config", "Configured escrow program ID is not a valid Solana public key."), connectedWalletSigns: true, backendCustody: false };
  if (programId === ESCROW_SOURCE_PLACEHOLDER_PROGRAM_ID) return { configured: true, verified: false, executable: false, programId, reason: "ESCROW_SOURCE_PLACEHOLDER_FORBIDDEN", evidence: evidence("invalid", "repository", "Compile-time escrow program ID cannot be promoted as a deployed runtime identifier."), connectedWalletSigns: true, backendCustody: false };
  return { configured: true, verified: false, executable: false, programId, reason: "ESCROW_RPC_VERIFICATION_REQUIRED", evidence: evidence("unverified", "operator-config", "Configured escrow program awaits Solana RPC executable-account verification."), connectedWalletSigns: true, backendCustody: false };
}

/** Configuration-only view. It never claims a configured program is deployed. */
export function escrowRuntimeStatus(): EscrowRuntimeStatus {
  return configuredStatus();
}

/** RPC-verifies that the configured escrow program account exists and is executable. */
export async function verifyEscrowRuntimeStatus(options: { readonly signal?: AbortSignal } = {}): Promise<EscrowRuntimeStatus> {
  const configured = configuredStatus();
  if (!configured.programId || configured.reason !== "ESCROW_RPC_VERIFICATION_REQUIRED") return configured;
  const checkedAt = new Date().toISOString();
  let urls: string[];
  try { urls = solanaRpcUrls(); } catch (reason) {
    const detail = reason instanceof Error ? reason.message : "ESCROW_SOLANA_RPC_REQUIRED";
    return { ...configured, reason: detail, evidence: evidence("unavailable", "solana-rpc", detail, checkedAt) };
  }
  const attempts: string[] = [];
  for (let endpointIndex = 0; endpointIndex < urls.length; endpointIndex += 1) {
    try {
      const account = await rpcAccountInfo(urls[endpointIndex]!, configured.programId, options.signal);
      if (!account) throw new Error("ESCROW_PROGRAM_ACCOUNT_NOT_FOUND");
      if (account.executable !== true) throw new Error("ESCROW_PROGRAM_NOT_EXECUTABLE");
      const verified = evidence("verified", "solana-rpc", "Configured escrow program account exists and is executable on Solana.", checkedAt, endpointIndex);
      return { configured: true, verified: true, executable: true, programId: configured.programId, evidence: verified, connectedWalletSigns: true, backendCustody: false };
    } catch (reason) {
      if (options.signal?.aborted) throw options.signal.reason instanceof Error ? options.signal.reason : new Error("ESCROW_VERIFICATION_ABORTED");
      attempts.push(reason instanceof Error ? reason.message : "ESCROW_RPC_VERIFICATION_FAILED");
    }
  }
  const detail = attempts.length ? `ESCROW_RPC_VERIFICATION_FAILED:${attempts.join("|")}` : "ESCROW_RPC_VERIFICATION_FAILED";
  return { ...configured, reason: detail, evidence: evidence("unavailable", "solana-rpc", detail, checkedAt) };
}

/**
 * Verifies a concrete checkout target against one consistent Solana RPC endpoint.
 * It checks executable program identity, program-owned Escrow/AllowedMint/Extensions
 * accounts, the Escrow PDA seed, mint allowlisting, account versions, and token mint owner.
 */
export async function verifyEscrowCheckoutTarget(input: { escrow: string; mint: string }): Promise<EscrowCheckoutEvidence> {
  const runtime = configuredStatus();
  if (!runtime.programId || runtime.reason !== "ESCROW_RPC_VERIFICATION_REQUIRED") throw new Error(runtime.reason ?? "ESCROW_UNAVAILABLE");
  const escrowAddress = requirePublicKey(input.escrow, "ESCROW_ADDRESS_INVALID");
  const mintAddress = requirePublicKey(input.mint, "ESCROW_MINT_INVALID");
  const program = new PublicKey(runtime.programId);
  const escrowKey = new PublicKey(escrowAddress);
  const mintKey = new PublicKey(mintAddress);
  const [allowedMintKey] = PublicKey.findProgramAddressSync([Buffer.from("allowed_mint"), escrowKey.toBuffer(), mintKey.toBuffer()], program);
  const [extensionsKey] = PublicKey.findProgramAddressSync([Buffer.from("extensions"), escrowKey.toBuffer()], program);
  const [vaultKey] = PublicKey.findProgramAddressSync([Buffer.from("vault"), escrowKey.toBuffer(), mintKey.toBuffer()], program);
  const urls = solanaRpcUrls();
  const checkedAt = new Date().toISOString();
  const attempts: string[] = [];

  for (let endpointIndex = 0; endpointIndex < urls.length; endpointIndex += 1) {
    try {
      const [programAccount, escrowAccount, allowedMintAccount, extensionsAccount, mintAccount] = await Promise.all([
        rpcAccountInfo(urls[endpointIndex]!, runtime.programId),
        rpcAccountInfo(urls[endpointIndex]!, escrowAddress),
        rpcAccountInfo(urls[endpointIndex]!, allowedMintKey.toBase58()),
        rpcAccountInfo(urls[endpointIndex]!, extensionsKey.toBase58()),
        rpcAccountInfo(urls[endpointIndex]!, mintAddress),
      ]);
      if (!programAccount?.executable) throw new Error("ESCROW_PROGRAM_NOT_EXECUTABLE");
      if (!escrowAccount || !allowedMintAccount || !extensionsAccount || !mintAccount) throw new Error("ESCROW_CHECKOUT_ACCOUNT_NOT_FOUND");
      if (mintAccount.owner !== TOKEN_PROGRAM_ID && mintAccount.owner !== TOKEN_2022_PROGRAM_ID) throw new Error("ESCROW_MINT_TOKEN_PROGRAM_UNSUPPORTED");

      const escrow = decodeEscrow(accountBytes(escrowAccount, runtime.programId, "Escrow"));
      const allowedMint = decodeAllowedMint(accountBytes(allowedMintAccount, runtime.programId, "AllowedMint"));
      const extensions = decodeExtensions(accountBytes(extensionsAccount, runtime.programId, "EscrowExtensions"));
      if (escrow.version !== ESCROW_CONFIG_VERSION || allowedMint.version !== ESCROW_CONFIG_VERSION || extensions.version !== ESCROW_CONFIG_VERSION) throw new Error("ESCROW_VERSION_UNSUPPORTED");
      const [derivedEscrow] = PublicKey.findProgramAddressSync([Buffer.from("escrow"), escrow.escrowSeed], program);
      if (!derivedEscrow.equals(escrowKey)) throw new Error("ESCROW_PDA_MISMATCH");
      if (allowedMint.escrow !== escrowAddress || extensions.escrow !== escrowAddress) throw new Error("ESCROW_ACCOUNT_RELATION_MISMATCH");
      if (allowedMint.mint !== mintAddress) throw new Error("ESCROW_ALLOWED_MINT_RELATION_MISMATCH");
      if (!allowedMint.allowed) throw new Error("ESCROW_MINT_NOT_ALLOWED");

      return {
        verified: true,
        checkedAt,
        endpointIndex,
        programId: runtime.programId,
        escrow: escrowAddress,
        mint: mintAddress,
        tokenProgramId: mintAccount.owner,
        allowedMint: allowedMintKey.toBase58(),
        extensions: extensionsKey.toBase58(),
        vault: vaultKey.toBase58(),
        escrowImmutable: escrow.immutable,
        extensionsImmutable: extensions.immutable,
        timelockSlots: extensions.timelockSlots.toString(),
        ...(extensions.hookProgram === ZERO_PUBKEY ? {} : { hookProgram: extensions.hookProgram }),
      };
    } catch (reason) {
      attempts.push(reason instanceof Error ? reason.message : "ESCROW_CHECKOUT_VERIFICATION_FAILED");
    }
  }
  if (attempts.length > 0 && attempts.every((attempt) => attempt === attempts[0])) throw new Error(attempts[0]!);
  throw new Error(`ESCROW_CHECKOUT_VERIFICATION_FAILED:${attempts.join("|")}`);
}
