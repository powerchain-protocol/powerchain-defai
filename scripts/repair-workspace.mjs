import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("[workspace:repair] Verifying Node and pnpm runtime.");
run(node, [path.join(repoRoot, "scripts", "require-node.mjs")]);
run(node, [path.join(repoRoot, "scripts", "require-pnpm.mjs")]);

console.log("[workspace:repair] Removing stale workspace modules and generated build outputs.");
run(node, [path.join(repoRoot, "scripts", "clean.mjs")]);

const lockfilePath = path.join(repoRoot, "pnpm-lock.yaml");
if (fs.existsSync(lockfilePath)) {
  console.log("[workspace:repair] Removing stale pnpm-lock.yaml so deprecated/transitive packages are re-resolved from current manifests.");
  fs.rmSync(lockfilePath, { force: true });
}

console.log("[workspace:repair] Reinstalling the pnpm workspace and generating a fresh lockfile from current manifests.");
run(pnpm, ["install", "--no-frozen-lockfile"]);
run(node, [path.join(repoRoot, "scripts", "check-ignored-builds.mjs")]);

if (fs.existsSync(path.join(repoRoot, "prisma", "schema.prisma"))) {
  console.log("[workspace:repair] Refreshing Prisma client and validating schema without running migrations.");
  run(node, [path.join(repoRoot, "scripts", "ensure-prisma-client.mjs")]);
  run(pnpm, ["prisma:validate"]);
}

console.log("[workspace:repair] Complete. Database migrations were not run.");
console.log("[workspace:repair] Start the Bridge app with: pnpm --filter @powerchain/bridge dev:standalone");
