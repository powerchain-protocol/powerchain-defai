import { createHash, createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";

const EPHEMERAL_IP_SALT = randomBytes(32);

export type ClientIpSecurityContext = {
  source: "vercel" | "none";
  pseudonymousKey: string | null;
  authoritativeForWalletIdentity: false;
  authoritativeForBridgeAccounting: false;
};

function normalizeIp(value: string | null | undefined): string | null {
  if (!value) return null;
  const first = value.split(",", 1)[0]?.trim() ?? "";
  return isIP(first) ? first : null;
}

/**
 * Trusts an IP signal only when running on Vercel and only from Vercel's platform
 * header. Generic X-Forwarded-For remains untrusted. The raw value must not be
 * persisted as wallet identity or settlement evidence.
 */
export function clientIpSecurityContext(headers: Headers, env: NodeJS.ProcessEnv = process.env): ClientIpSecurityContext {
  const onVercel = env.VERCEL === "1";
  const address = onVercel ? normalizeIp(headers.get("x-vercel-forwarded-for")) : null;
  const secret = env.POWERCHAIN_IP_HASH_SECRET?.trim();
  const pseudonymousKey = address
    ? secret && secret.length >= 32
      ? createHmac("sha256", secret).update(`powerchain-ip-v1:${address}`).digest("hex")
      : createHash("sha256").update(EPHEMERAL_IP_SALT).update(address).digest("hex")
    : null;
  return {
    source: address ? "vercel" : "none",
    pseudonymousKey,
    authoritativeForWalletIdentity: false,
    authoritativeForBridgeAccounting: false,
  };
}
