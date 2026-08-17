import fs from "node:fs";
import path from "node:path";

const read = (file) => fs.readFileSync(path.resolve(file), "utf8");
const failures = [];

const operations = read("apps/backend/src/services/operations.ts");
for (const marker of [
  "OperatorAttentionSummary",
  "nextBefore",
  "before?: Date",
  'queue?: OperatorAttentionQueue',
  'authoritativeForSettlement: false',
]) if (!operations.includes(marker)) failures.push(`operations missing ${marker}`);

const route = read("apps/bridge/app/api/v1/operator/operations/attention/route.ts");
for (const marker of [
  "INVALID_BEFORE_CURSOR",
  "INVALID_QUEUE",
  "requireServiceFeeOperator",
  'enforceRateLimit("operator"',
]) if (!route.includes(marker)) failures.push(`attention route missing ${marker}`);
for (const forbidden of ["sourceAddress", "destinationAddress", "reconciliationEvidence", "privateKey", "secretKey"]) {
  if (route.includes(forbidden)) failures.push(`attention route leaks forbidden field marker ${forbidden}`);
}

const readinessRoute = read("apps/bridge/app/api/v1/system/readiness/route.ts");
if (!readinessRoute.includes("maintenance:")) failures.push("blocked readiness fallback missing maintenance contract");
if (!readinessRoute.includes("quiescent: false")) failures.push("blocked readiness fallback must not claim quiescence");

for (const file of ["scripts/deploy-drain-wait.mjs", "scripts/deploy-resume-check.mjs", "scripts/operator-attention.mjs"]) {
  if (!fs.existsSync(file)) failures.push(`${file} missing`);
}
const drain = read("scripts/deploy-drain-wait.mjs");
for (const marker of ["maintenance?.draining", "maintenance?.quiescent", "activeLeases === 0", "databaseReady"]) {
  if (!drain.includes(marker)) failures.push(`drain waiter missing ${marker}`);
}
const resume = read("scripts/deploy-resume-check.mjs");
for (const marker of ["newOperations", "asyncSettlement", "drain mode is still enabled"]) {
  if (!resume.includes(marker)) failures.push(`resume check missing ${marker}`);
}
const attention = read("scripts/operator-attention.mjs");
for (const marker of ["POWERCHAIN_OPERATOR_API_TOKEN", 'authorization: `Bearer ${token}`', "--queue must be bridge, claims, or fees"]) {
  if (!attention.includes(marker)) failures.push(`operator attention cli missing ${marker}`);
}

const pkg = JSON.parse(read("package.json"));
for (const script of ["deploy:drain:wait", "deploy:resume:check", "operator:attention", "operator-maintenance:production:check"]) {
  if (!pkg.scripts?.[script]) failures.push(`package script missing ${script}`);
}
if (!pkg.scripts?.["verify:production"]?.includes("operator-maintenance:production:check")) failures.push("operator maintenance gate not wired into verify:production");

if (failures.length) {
  console.error(`[operator-maintenance] ${failures.length} failure(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("[operator-maintenance] attention pagination/filtering, drain wait, resume checks, and blocked readiness fallback passed");
