import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

const encoder = new TextEncoder();
export function verifySolanaMessageSignature(input: { address: string; message: string; signature: string }): boolean {
  try {
    const publicKey = new PublicKey(input.address);
    const signature = bs58.decode(input.signature);
    return nacl.sign.detached.verify(encoder.encode(input.message), signature, publicKey.toBytes());
  } catch { return false; }
}
export function buildWalletChallenge(input: { domain: string; nonce: string; expiresAt: string; purpose: string }): string {
  return [`PowerChain`, `Domain: ${input.domain}`, `Purpose: ${input.purpose}`, `Nonce: ${input.nonce}`, `Expires: ${input.expiresAt}`].join("\n");
}
