import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

function bearer(req: Request): string {
  const value = req.headers.get("authorization")?.trim() ?? "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
}

function secureEqual(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

function stableActor(prefix: string, configured: string | undefined, token: string): string {
  const actor = configured?.trim();
  if (actor) return actor;
  return `${prefix}:${createHash("sha256").update(token).digest("hex").slice(0, 12)}`;
}

export function requireServiceFeeOperator(req: Request): string {
  const expected = process.env.POWERCHAIN_OPERATOR_API_TOKEN?.trim() ?? "";
  const supplied = bearer(req);
  if (!expected || !supplied || !secureEqual(expected, supplied)) throw new Error("OPERATOR_UNAUTHORIZED");
  return stableActor("operator", process.env.POWERCHAIN_OPERATOR_ID, expected);
}

export function requireServiceFeeGovernance(req: Request): string {
  const expected = process.env.POWERCHAIN_GOVERNANCE_API_TOKEN?.trim() ?? "";
  const supplied = bearer(req);
  if (!expected || !supplied || !secureEqual(expected, supplied)) throw new Error("GOVERNANCE_UNAUTHORIZED");
  return stableActor("governance", process.env.POWERCHAIN_GOVERNANCE_ID, expected);
}
