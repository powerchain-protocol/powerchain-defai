import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "package.json");
const lockfilePath = path.join(root, "pnpm-lock.yaml");
const failures = [];

const fail = (message) => failures.push(message);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (manifest.packageManager !== "pnpm@11.22.0") {
  fail(`packageManager must be pnpm@11.22.0 (found ${manifest.packageManager ?? "missing"})`);
}
if (manifest.engines?.node !== ">=24 <26") fail(`engines.node must be >=24 <26 (found ${manifest.engines?.node ?? "missing"})`);
if (manifest.engines?.pnpm !== ">=11.22.0 <12") fail(`engines.pnpm must be >=11.22.0 <12 (found ${manifest.engines?.pnpm ?? "missing"})`);

for (const competitor of ["package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "bun.lock", "bun.lockb"]) {
  if (fs.existsSync(path.join(root, competitor))) fail(`${competitor} must not exist in this pnpm-only workspace`);
}

if (!fs.existsSync(lockfilePath)) {
  fail("pnpm-lock.yaml is missing; run one reviewed root `pnpm install --no-frozen-lockfile`, review the diff, and commit the generated lockfile before release/deploy");
} else {
  const lockfile = fs.readFileSync(lockfilePath, "utf8");
  if (!/^lockfileVersion:\s*['\"]?\d/m.test(lockfile)) fail("pnpm-lock.yaml does not contain a recognizable lockfileVersion");
  if (!/^importers:\s*$/m.test(lockfile)) fail("pnpm-lock.yaml does not contain an importers section");
  if (/(?:^|\s)aptos@1\.22\.1(?:\s|:|$)/m.test(lockfile)) fail("pnpm-lock.yaml retains deprecated aptos@1.22.1; run `pnpm workspace:repair` to rebuild the graph from current manifests");
  if (/(?:^|\s)@pythnetwork\/pyth-sui-js@(?:3\.0\.0|[^\s:]+)/m.test(lockfile)) fail("pnpm-lock.yaml retains @pythnetwork/pyth-sui-js even though PowerChain uses @mysten/sui plus Hermes REST; run `pnpm workspace:repair` to rebuild the graph from current manifests");
  for (const importer of [".", "apps/bridge", "apps/worker-bridge", "apps/worker-claims", "apps/worker-fees", "packages/database", "packages/runtime"]) {
    const escaped = importer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^\\s{2}['\"]?${escaped}['\"]?:\\s*$`, "m");
    if (!pattern.test(lockfile)) fail(`pnpm-lock.yaml is missing required workspace importer ${importer}`);
  }
}

if (failures.length) {
  console.error("Lockfile production check failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log("LOCKFILE_PRODUCTION_CHECK_PASS packageManager=pnpm@11.22.0");
