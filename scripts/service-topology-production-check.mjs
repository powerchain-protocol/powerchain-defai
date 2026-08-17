import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const json = (rel) => JSON.parse(read(rel));
const must = (condition, message) => { if (!condition) throw new Error(message); };

const rootPackage = json("package.json");
const backendPackage = json("apps/backend/package.json");
const workerConfig = read("apps/backend/src/workers/config.ts");
const operations = read("apps/backend/src/services/operations.ts");
const systemReadiness = read("apps/bridge/server/services/system-readiness.ts");
const readinessTypes = read("apps/bridge/types/system-readiness.ts");

must(rootPackage.scripts["dev:stack"]?.includes("@powerchain/bridge"), "DEV_STACK_BRIDGE_REQUIRED");
for (const worker of ["@powerchain/worker-bridge", "@powerchain/worker-claims", "@powerchain/worker-fees"]) {
  must(rootPackage.scripts["dev:stack"]?.includes(worker), `DEV_STACK_WORKER_REQUIRED:${worker}`);
}
must(!rootPackage.scripts["dev:stack"]?.includes("@powerchain/backend"), "BACKEND_LIBRARY_MUST_NOT_BE_RUNTIME_DAEMON");
must(backendPackage.scripts.dev?.includes("tsc --noEmit --watch"), "BACKEND_DEV_MUST_BE_LIBRARY_WATCH");
must(!backendPackage.scripts.start, "BACKEND_LIBRARY_MUST_NOT_DECLARE_START_DAEMON");

for (const marker of ['WORKER_KINDS = ["bridge", "claims", "fees"]', "REQUIRED_WORKER_KINDS", "WorkerKind = (typeof WORKER_KINDS)[number]"]) {
  must(workerConfig.includes(marker), `WORKER_TOPOLOGY_MARKER_MISSING:${marker}`);
}
for (const marker of ["requiredTypes: [...REQUIRED_WORKER_KINDS]", "heartbeatAt !== null", "readyCount", "missing", "stale"]) {
  must(operations.includes(marker), `OPERATIONS_WORKER_EVIDENCE_MISSING:${marker}`);
}
must(!systemReadiness.includes("workerObserved = operations?.workers.workers.length"), "READINESS_MUST_NOT_COUNT_REQUIRED_ROWS_AS_OBSERVED");
for (const marker of ["operations?.workers.observed", "operations?.workers.readyCount", "operations?.workers.missing", "operations?.workers.stale"]) {
  must(systemReadiness.includes(marker), `SYSTEM_READINESS_WORKER_EVIDENCE_MISSING:${marker}`);
}
for (const marker of ["readyCount: number", "missing: readonly string[]", "stale: readonly string[]"]) {
  must(readinessTypes.includes(marker), `READINESS_TYPE_TOPOLOGY_MISSING:${marker}`);
}

for (const rel of ["apps/worker-bridge/package.json", "apps/worker-claims/package.json", "apps/worker-fees/package.json"]) {
  const pkg = json(rel);
  // Workers intentionally execute TypeScript through the tsx Node loader. The loader is
  // therefore a production runtime dependency; TypeScript itself remains build/typecheck tooling.
  must(pkg.scripts.start?.includes("--import tsx"), `${rel}:TSX_RUNTIME_LOADER_REQUIRED`);
  must(pkg.dependencies?.tsx, `${rel}:TSX_RUNTIME_DEPENDENCY_REQUIRED`);
  must(!pkg.dependencies?.typescript && pkg.devDependencies?.typescript, `${rel}:TYPESCRIPT_MUST_REMAIN_DEV_DEPENDENCY`);
  must(!pkg.scripts.prestart?.includes("prisma:ensure"), `${rel}:RUNTIME_START_MUST_NOT_GENERATE_PRISMA`);
}

console.log("service-topology-production-check: PASS — one web runtime, three supervised workers, backend remains a library, worker readiness counts heartbeat evidence");
