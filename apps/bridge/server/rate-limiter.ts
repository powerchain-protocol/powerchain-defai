import "server-only";
import { createHash } from "node:crypto";
import { clientIpSecurityContext } from "@powerchain/backend/services/ip-security";
import { prisma } from "@powerchain/database/prisma";
import type { PrismaTransactionClient } from "@powerchain/database/prisma";

type Scope = "operator" | "governance" | "public-read" | "mutation";
const DEFAULTS: Record<Scope, { limit: number; windowMs: number }> = {
  operator: { limit: 60, windowMs: 60_000 },
  governance: { limit: 30, windowMs: 60_000 },
  "public-read": { limit: 300, windowMs: 60_000 },
  mutation: { limit: 60, windowMs: 60_000 },
};
function hashKey(scope: Scope, actor: string) {
  return `${scope}:${createHash("sha256").update(actor).digest("hex")}`;
}
function clientIdentity(headers: Headers): string {
  // Authenticated actor IDs are preferred. Anonymous traffic receives only a
  // platform-validated pseudonymous key; raw client IPs never enter storage.
  return clientIpSecurityContext(headers).pseudonymousKey ?? "anonymous";
}
export async function enforceRateLimit(scope: Scope, headers: Headers, actor?: string | null) {
  const policy = DEFAULTS[scope];
  const key = hashKey(scope, actor?.trim() || clientIdentity(headers));
  const now = new Date();
  return prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const current = await tx.apiRateLimitWindow.findUnique({ where: { key } });
    if (!current || now.getTime() - current.windowStartedAt.getTime() >= policy.windowMs) {
      await tx.apiRateLimitWindow.upsert({ where: { key }, create: { key, count: 1, windowStartedAt: now }, update: { count: 1, windowStartedAt: now } });
      return { allowed: true, remaining: policy.limit - 1, retryAfterSeconds: 0 };
    }
    const row = await tx.apiRateLimitWindow.update({ where: { key }, data: { count: { increment: 1 } } });
    const allowed = row.count <= policy.limit;
    const resetAt = current.windowStartedAt.getTime() + policy.windowMs;
    return { allowed, remaining: Math.max(0, policy.limit - row.count), retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)) };
  });
}
