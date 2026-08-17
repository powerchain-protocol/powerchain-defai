import { createHash, createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";

const EPHEMERAL_IP_SALT = randomBytes(32);

export type ClientIpSecurityContext = {
  source: "vercel" | "cloudflare" | "none";
  pseudonymousKey: string | null;
  authoritativeForWalletIdentity: false;
  authoritativeForBridgeAccounting: false;
};

function normalizeIp(value: string | null | undefined): string | null {
  if (!value) return null;
  const first = value.split(",", 1)[0]?.trim() ?? "";
  return isIP(first) ? first : null;
}

function runtimePlatform(env: NodeJS.ProcessEnv): "vercel" | "cloudflare" | "none" {
  if (env.VERCEL === "1") return "vercel";
  if (env.POWERCHAIN_RUNTIME_PLATFORM?.trim().toLowerCase() === "cloudflare") return "cloudflare";
  return "none";
}

/**
 * Trust an edge-provided client IP only when the runtime platform is explicit.
 * Generic X-Forwarded-For and X-Real-IP are never accepted. Raw addresses are
 * converted to pseudonymous keys and are never wallet identity or settlement
 * evidence.
 */
export function clientIpSecurityContext(headers: Headers, env: NodeJS.ProcessEnv = process.env): ClientIpSecurityContext {
  const platform = runtimePlatform(env);
  const address = platform === "vercel"
    ? normalizeIp(headers.get("x-vercel-forwarded-for"))
    : platform === "cloudflare"
      ? normalizeIp(headers.get("cf-connecting-ip"))
      : null;
  const secret = env.POWERCHAIN_IP_HASH_SECRET?.trim();
  const pseudonymousKey = address
    ? secret && secret.length >= 32
      ? createHmac("sha256", secret).update(`powerchain-ip-v1:${address}`).digest("hex")
      : createHash("sha256").update(EPHEMERAL_IP_SALT).update(address).digest("hex")
    : null;
  return {
    source: address ? platform : "none",
    pseudonymousKey,
    authoritativeForWalletIdentity: false,
    authoritativeForBridgeAccounting: false,
  };
}
