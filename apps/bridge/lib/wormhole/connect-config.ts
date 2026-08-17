"use client";

/**
 * Wormhole NTT execution is intentionally not bundled through the broad
 * broad Wormhole Connect package. That widget installs chain
 * surfaces PowerChain does not support (including deprecated Aptos packages).
 *
 * Operators may point this app at a reviewed HTTPS NTT execution surface while
 * PowerChain remains authoritative for quote binding, persisted transfer state,
 * finality checks and reconciliation.
 */
export function readPowerChainNttTransferUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_POWERCHAIN_NTT_TRANSFER_URL?.trim();
  if (!raw) return null;
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("POWERCHAIN_NTT_TRANSFER_URL_INVALID"); }
  if (url.protocol !== "https:") throw new Error("POWERCHAIN_NTT_TRANSFER_URL_HTTPS_REQUIRED");
  if (url.username || url.password || url.hash) throw new Error("POWERCHAIN_NTT_TRANSFER_URL_UNSAFE");
  return url.toString();
}
