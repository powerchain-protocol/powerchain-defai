import fs from "node:fs";
const files = [
  "apps/bridge/server/services/program-readiness.ts",
  "apps/bridge/types/programs.ts",
  "apps/bridge/lib/data/program-runtime-validation.ts",
  "apps/bridge/backend/program-client.ts",
  "apps/bridge/components/protocol/protocol-dashboard.tsx",
  "docs/PROGRAM_RUNTIME_EVIDENCE_CACHE.md",
];
for (const file of files) if (!fs.existsSync(file)) throw new Error(`missing ${file}`);
const service=fs.readFileSync(files[0],"utf8");
const types=fs.readFileSync(files[1],"utf8");
const validation=fs.readFileSync(files[2],"utf8");
const client=fs.readFileSync(files[3],"utf8");
const ui=fs.readFileSync(files[4],"utf8");
if (!service.includes("POWERCHAIN_PROGRAM_EVIDENCE_CACHE_TTL_MS") || !service.includes("evidenceCache") || !service.includes("inFlight")) throw new Error("program evidence cache/coalescing missing");
if (!service.includes('evidenceMode: "cache"') || !service.includes('evidenceMode: "live"') || !service.includes("cacheAgeMs")) throw new Error("cache provenance missing");
if (!types.includes('ProgramEvidenceMode = "live" | "cache"') || !types.includes("readonly cacheAgeMs: number")) throw new Error("cache contract missing");
if (!validation.includes("MODES") || !validation.includes("cacheAgeMs")) throw new Error("cache payload validation missing");
if (!client.includes("?force=1") || !ui.includes("runtime.refresh(true)")) throw new Error("manual verification does not force live evidence");
for (const file of [".env.example",".env.local.example",".env.production.example"]) if (!fs.readFileSync(file,"utf8").includes("POWERCHAIN_PROGRAM_EVIDENCE_CACHE_TTL_MS=15000")) throw new Error(`missing cache template in ${file}`);
console.log("POWERCHAIN_PROGRAM_RUNTIME_CACHE_PASS");
