import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = process.argv[2] || "apps/bridge";
const appRoot = path.resolve(root, target);
const nextRoot = path.join(appRoot, ".next");

for (const relative of ["dev", "cache"]) {
  const candidate = path.join(nextRoot, relative);
  if (!candidate.startsWith(nextRoot + path.sep)) throw new Error("INVALID_NEXT_CACHE_TARGET");
  fs.rmSync(candidate, { recursive: true, force: true });
}

console.log(`[next:dev-cache] Cleared stale Turbopack dev/cache state for ${target}.`);
