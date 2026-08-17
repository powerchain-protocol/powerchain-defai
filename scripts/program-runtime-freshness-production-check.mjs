import fs from "node:fs";

const required = [
  "apps/bridge/server/services/program-readiness.ts",
  "apps/bridge/hooks/use-program-readiness.ts",
  "apps/bridge/components/protocol/protocol-dashboard.tsx",
  "apps/bridge/types/programs.ts",
  "apps/bridge/lib/data/program-runtime-validation.ts",
  "docs/PROGRAM_RUNTIME_FRESHNESS.md",
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`missing ${file}`);

const service = fs.readFileSync(required[0], "utf8");
const hook = fs.readFileSync(required[1], "utf8");
const ui = fs.readFileSync(required[2], "utf8");
const types = fs.readFileSync(required[3], "utf8");
const validation = fs.readFileSync(required[4], "utf8");

if (!service.includes("POWERCHAIN_PROGRAM_VERIFIER_TIMEOUT_MS") || !service.includes("withVerifierDeadline") || !service.includes("ProgramVerifierTimeoutError")) throw new Error("Program verifiers do not have a bounded deadline");
if (!service.includes("timedOut: error instanceof ProgramVerifierTimeoutError") || !service.includes("timedOutCount")) throw new Error("Verifier timeout evidence is not propagated");
if (!hook.includes("staleAfterMs") || !hook.includes("staleProgramIds") || !hook.includes("coreEvidenceFresh")) throw new Error("Client evidence freshness lifecycle is missing");
if (!ui.includes("Stale evidence") || !ui.includes("Timed out") || !ui.includes("coreEvidenceFresh")) throw new Error("Protocol UI does not surface stale/timeout evidence");
if (!types.includes("readonly timedOut: boolean") || !types.includes("readonly timedOutCount: number")) throw new Error("Program runtime timeout contract is incomplete");
if (!validation.includes('typeof value.timedOut === "boolean"') || !validation.includes('typeof value.timedOutCount === "number"')) throw new Error("Program runtime timeout payload validation is incomplete");
for (const file of [".env.example", ".env.local.example", ".env.production.example"]) {
  if (!fs.readFileSync(file, "utf8").includes("POWERCHAIN_PROGRAM_VERIFIER_TIMEOUT_MS=7000")) throw new Error(`Missing verifier timeout template in ${file}`);
}
console.log("POWERCHAIN_PROGRAM_RUNTIME_FRESHNESS_PASS");
