export type WalletActivityCursor = {
  v: 1;
  solana?: { kind: "helius-pagination-token" | "signature"; value: string } | null;
  sui?: { kind: "graphql-cursor" | "sui-rpc-cursor"; value: string } | null;
};

const MAX_CURSOR_LENGTH = 1024;
const SAFE_VALUE = /^[A-Za-z0-9:_+\-=./]{1,512}$/;

function toBase64Url(value: string) {
  if (typeof Buffer !== "undefined") return Buffer.from(value, "utf8").toString("base64url");
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  if (typeof Buffer !== "undefined") return Buffer.from(value, "base64url").toString("utf8");
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new TextDecoder().decode(bytes);
}

function validPart(value: unknown, kinds: string[]) {
  if (value == null) return value === null;
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.kind === "string" && kinds.includes(row.kind) && typeof row.value === "string" && SAFE_VALUE.test(row.value);
}

export function encodeWalletActivityCursor(cursor: WalletActivityCursor | null | undefined) {
  if (!cursor || (!cursor.solana && !cursor.sui)) return null;
  return toBase64Url(JSON.stringify(cursor));
}

export function decodeWalletActivityCursor(value: string | null | undefined): WalletActivityCursor | null {
  if (!value) return null;
  if (value.length > MAX_CURSOR_LENGTH || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("invalid wallet activity cursor");
  let parsed: unknown;
  try { parsed = JSON.parse(fromBase64Url(value)); } catch { throw new Error("invalid wallet activity cursor"); }
  if (!parsed || typeof parsed !== "object") throw new Error("invalid wallet activity cursor");
  const row = parsed as Record<string, unknown>;
  if (row.v !== 1) throw new Error("unsupported wallet activity cursor version");
  if (!validPart(row.solana, ["helius-pagination-token", "signature"])) throw new Error("invalid Solana wallet activity cursor");
  if (!validPart(row.sui, ["graphql-cursor", "sui-rpc-cursor"])) throw new Error("invalid Sui wallet activity cursor");
  return row as WalletActivityCursor;
}
