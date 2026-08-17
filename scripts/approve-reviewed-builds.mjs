import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

// Keep this list intentionally identical to pnpm-workspace.yaml allowBuilds=true.
// A package must be reviewed before it is added here.
const reviewed = Object.freeze([
  "bigint-buffer",
  "bufferutil",
  "utf-8-validate",
  "@prisma/engines",
  "prisma",
  "esbuild",
  "sharp",
  "@stellar/stellar-sdk",
  "@tailwindcss/oxide",
  "blake-hash",
  "keccak",
  "protobufjs",
  "tiny-secp256k1",
  "usb",
]);

function run(args, { allowFailure = false } = {}) {
  const result = spawnSync(pnpm, args, { cwd: repoRoot, stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (!allowFailure && result.status !== 0) process.exit(result.status ?? 1);
  return result.status ?? 1;
}

console.log(`[deps:approve-reviewed] Approving ${reviewed.length} reviewed dependency build packages.`);
run(["approve-builds", ...reviewed]);

// Rebuild is useful when node_modules already exists from an earlier install where
// scripts were ignored. It is safe to skip if dependencies are not installed yet.
const rebuildStatus = run(["rebuild", ...reviewed], { allowFailure: true });
if (rebuildStatus !== 0) {
  console.log("[deps:approve-reviewed] Rebuild deferred until after pnpm install.");
}
console.log("[deps:approve-reviewed] Build-policy approval complete.");
