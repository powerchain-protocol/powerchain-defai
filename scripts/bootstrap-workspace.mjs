import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function run(command, args) {
  const result = spawnSync(command, args, { cwd: repoRoot, stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(node, [path.join(repoRoot, "scripts", "require-node.mjs")]);
run(node, [path.join(repoRoot, "scripts", "require-pnpm.mjs")]);
run(node, [path.join(repoRoot, "scripts", "bootstrap-env.mjs")]);
run(node, [path.join(repoRoot, "scripts", "approve-reviewed-builds.mjs")]);
run(pnpm, ["install"]);
run(node, [path.join(repoRoot, "scripts", "check-ignored-builds.mjs")]);

// Prisma generation is local and deterministic once dependencies exist. Prisma
// loads the root .env itself. Do not run migrations here: schema mutation remains
// an explicit operator action.
if (fs.existsSync(path.join(repoRoot, "prisma", "schema.prisma"))) {
  run(node, [path.join(repoRoot, "scripts", "ensure-prisma-client.mjs")]);
  run(pnpm, ["prisma:validate"]);
}

console.log("[workspace:bootstrap] PowerChain workspace dependencies and environment are ready.");
