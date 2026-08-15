#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message) => { console.error(`POWERCHAIN_RUNTIME_WIRING_CHECK_FAILED: ${message}`); process.exit(1); };
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

const service = read("apps/bridge/server/services/bridge-runtime.ts");
const guard = read("apps/bridge/server/http/bridge-runtime-guard.ts");
const route = read("apps/bridge/app/api/v1/bridge/runtime/route.ts");
const hook = read("apps/bridge/hooks/use-bridge-runtime.ts");
if (!service.includes("capabilities") || !service.includes("canSubmitTransfer")) fail("runtime capability matrix missing");
if (!service.includes("snapshotId") || !service.includes("validUntil")) fail("runtime snapshot/freshness contract missing");
if (!service.includes("POWERCHAIN_BRIDGE_RUNTIME_TTL_MS")) fail("bounded runtime TTL configuration missing");
if (!guard.includes("enforceBridgeRuntimeRequest") || !guard.includes("BRIDGE_RUNTIME_BLOCKED")) fail("fail-closed route guard missing");
if (!guard.includes('"retry-after": "5"')) fail("blocked mutation response must advertise bounded retry delay");
if (!route.includes("x-powerchain-runtime-snapshot") || !route.includes("x-powerchain-runtime-valid-until")) fail("runtime response headers missing");
if (!hook.includes("stale") || !hook.includes("Date.parse(data.validUntil)")) fail("client runtime freshness enforcement missing");
if (!hook.includes("canSubmitTransfer")) fail("client transfer-submit capability missing");

const guarded = [
  ["apps/bridge/app/api/v1/bridge/quote/route.ts", "quote"],
  ["apps/bridge/app/api/v1/quotes/route.ts", "quote"],
  ["apps/bridge/app/api/v1/bridge/transfers/route.ts", "transfer-submit"],
  ["apps/bridge/app/api/v1/transfers/route.ts", "transfer-submit"],
  ["apps/bridge/app/api/v1/bridge/transfer/route.ts", "transfer-submit"],
  ["apps/bridge/app/api/v1/bridge/submit/route.ts", "transfer-submit"],
  ["apps/bridge/app/api/v1/bridge/create/route.ts", "transfer-submit"],
];
for (const [rel, capability] of guarded) {
  if (!exists(rel)) continue;
  const text = read(rel);
  if (!/export\s+async\s+function\s+POST\s*\(/.test(text)) continue;
  if (!text.includes("enforceBridgeRuntimeRequest")) fail(`${rel} is a bridge mutation route but has no runtime guard`);
  if (!text.includes(`enforceBridgeRuntimeRequest("${capability}")`)) fail(`${rel} has the wrong runtime capability guard`);
}

// Status/history/realtime reads must not be runtime-blocked; they are recovery paths.
for (const rel of [
  "apps/bridge/app/api/v1/bridge/status/route.ts",
  "apps/bridge/app/api/v1/history/route.ts",
]) {
  if (exists(rel) && read(rel).includes("enforceBridgeRuntimeRequest")) fail(`${rel} must remain observable during runtime incidents`);
}

console.log("POWERCHAIN_RUNTIME_WIRING_CHECK_OK version=1.0.0");
