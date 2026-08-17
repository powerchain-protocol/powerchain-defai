import fs from "node:fs";

const files = [
  "apps/bridge/server/services/program-readiness.ts",
  "apps/staking/src/services/staking.ts",
  "apps/staking/src/verification.ts",
  "apps/backend/src/escrow/config.ts",
  "docs/PROGRAM_RUNTIME_ABORT_AND_CACHE_INVALIDATION.md",
];
for (const file of files) if (!fs.existsSync(file)) throw new Error(`missing ${file}`);

const service = fs.readFileSync(files[0], "utf8");
const stakingService = fs.readFileSync(files[1], "utf8");
const stakingVerification = fs.readFileSync(files[2], "utf8");
const escrow = fs.readFileSync(files[3], "utf8");

for (const marker of ["AbortController", "controller.abort(timeout)", "deploymentFingerprint", "stableFingerprint", "cached.fingerprint !== fingerprint", "deploymentFingerprint(id) === fingerprint"]) {
  if (!service.includes(marker)) throw new Error(`program runtime abort/cache marker missing: ${marker}`);
}
if (!service.includes("VERIFIERS[id](signal)") || !service.includes("{ signal, timeoutMs: 4_000")) throw new Error("program RPC abort propagation missing");
if (!stakingService.includes("signal?: AbortSignal") || !stakingService.includes("signal: options.signal")) throw new Error("staking status abort contract missing");
if (!stakingVerification.includes("parentSignal?: AbortSignal") || !stakingVerification.includes("input.signal?.aborted")) throw new Error("staking RPC abort propagation missing");
if (!escrow.includes("verifyEscrowRuntimeStatus(options: { readonly signal?: AbortSignal }") || !escrow.includes("options.signal?.aborted")) throw new Error("escrow abort propagation missing");
console.log("POWERCHAIN_PROGRAM_RUNTIME_ABORT_CACHE_PASS");
