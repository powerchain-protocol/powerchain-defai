#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const fail = (m) => { console.error(`POWERCHAIN_BRIDGE_CORE_CHECK_FAILED: ${m}`); process.exit(1); };
const read = (r) => fs.readFileSync(path.join(root, r), "utf8");
const required = [
  "apps/bridge/lib/bridge/base-units.ts",
  "apps/bridge/lib/bridge/route-contract.ts",
  "apps/bridge/lib/bridge/transition-policy.ts",
  "apps/bridge/server/services/bridge-intent.ts",
  "apps/bridge/server/http/bridge-mutation-contract.ts",
  "apps/bridge/lib/actions/bridge-fetch.ts",
];
for (const r of required) if (!fs.existsSync(path.join(root, r))) fail(`missing ${r}`);
const amount = read(required[0]);
const transitions = read(required[2]);
const intent = read(required[3]);
const mutation = read(required[4]);
const client = read(required[5]);
if (!amount.includes("BigInt") || amount.includes("parseFloat") || amount.includes("Number(value)")) fail("asset amount utilities must remain integer-exact");
if (!transitions.includes("INVALID_BRIDGE_TRANSITION") || !transitions.includes("RECONCILIATION_REQUIRED")) fail("bridge transition guard missing");
if (!intent.includes('createHash("sha256")') || !intent.includes("runtimeSnapshotId") || !intent.includes("feeRecipient") || !intent.includes("quoteExpiresAt")) fail("deterministic bridge intent commitment missing required bindings");
if (!intent.includes("totalSourceDebitBaseUnits")) fail("principal+fee source debit binding missing");
if (!mutation.includes("IDEMPOTENCY_KEY_REQUIRED") || !mutation.includes("PAYLOAD_TOO_LARGE") || !mutation.includes("UNSUPPORTED_MEDIA_TYPE")) fail("mutation request hardening missing");
if (!client.includes("Check transfer status before retrying a submission")) fail("unknown submission recovery warning missing");
if (!client.includes("cache: \"no-store\"")) fail("client mutation fetch must be no-store");
const guardedTargets = [
  ["apps/bridge/app/api/v1/bridge/quote/route.ts", "quote"],
  ["apps/bridge/app/api/v1/quotes/route.ts", "quote"],
  ["apps/bridge/app/api/v1/bridge/transfers/route.ts", "transfer-submit"],
  ["apps/bridge/app/api/v1/transfers/route.ts", "transfer-submit"],
  ["apps/bridge/app/api/v1/bridge/transfer/route.ts", "transfer-submit"],
  ["apps/bridge/app/api/v1/bridge/submit/route.ts", "transfer-submit"],
  ["apps/bridge/app/api/v1/bridge/create/route.ts", "transfer-submit"],
];
for (const [rel, capability] of guardedTargets) {
  if (!fs.existsSync(path.join(root, rel))) continue;
  const text = read(rel);
  if (/export\s+async\s+function\s+POST\s*\((?:request|req)\b/.test(text)) {
    if (!text.includes("validateBridgeMutationRequest")) fail(`${rel} missing mutation request validation`);
    if (!text.includes(`enforceBridgeRuntimeRequest(\"${capability}\")`) && !text.includes(`enforceBridgeRuntimeRequest("${capability}")`)) fail(`${rel} missing runtime capability guard`);
  }
}
console.log(JSON.stringify({ ok: true, version: "1.0.0", checks: ["exact base units", "canonical routes", "transition policy", "intent commitment", "request hardening", "idempotency key", "safe client action helper"] }, null, 2));
