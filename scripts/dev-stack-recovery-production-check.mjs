import fs from "node:fs";

const checks = [
  ["sourceable root bootstrap exists", "bootstrap.sh", (s) => s.includes("must be sourced") && s.includes("bootstrap-toolchain.sh")],
  ["toolchain bootstrap owns Node/pnpm activation", "scripts/bootstrap-toolchain.sh", (s) => s.includes('POWERCHAIN_NODE_VERSION="24.19.0"') && s.includes('POWERCHAIN_PNPM_VERSION="11.22.0"') && s.includes("SHASUMS256.txt")],
  ["workspace recovery wrapper activates toolchain first", "scripts/recover-workspace.sh", (s) => s.includes('source "$SCRIPT_DIR/bootstrap-toolchain.sh"') && s.includes("pnpm workspace:repair") && s.includes("pnpm workspace:install:check")],
  ["Node mismatch points to root bootstrap", "scripts/require-node.mjs", (s) => s.includes("source ./bootstrap.sh")],
  ["dev stack has install/database preflight", "package.json", (s) => s.includes('"predev:stack": "pnpm workspace:install:ensure && pnpm env:bootstrap && pnpm prisma:ensure && pnpm db:preflight"')],
  ["workspace install/ensure scripts exist", "package.json", (s) => s.includes('"workspace:install:check": "node scripts/workspace-install-preflight.mjs"') && s.includes('"workspace:install:ensure": "node scripts/workspace-install-ensure.mjs"')],
  ["local ensure installs without deleting lockfile", "scripts/workspace-install-ensure.mjs", (s) => s.includes('install", "--no-frozen-lockfile"') && !s.includes('rmSync(lockfile') && s.includes('POWERCHAIN_AUTO_INSTALL')],
  ["Bridge resolves Next by module path", "scripts/next-cli.mjs", (s) => s.includes('resolve("next/dist/bin/next")') && s.includes("pnpm workspace:repair")],
  ["install preflight probes Bridge Next", "scripts/workspace-install-preflight.mjs", (s) => s.includes('["apps/bridge", "next/dist/bin/next"]')],
  ["install preflight probes backend workspace dependencies", "scripts/workspace-install-preflight.mjs", (s) => s.includes('@powerchain/bridge-core') && s.includes('@mysten/sui/grpc') && s.includes('@solana/spl-token')],
  ["Prisma freshness is source-hash based", "scripts/ensure-prisma-client.mjs", (s) => s.includes('.source.sha256') && s.includes('createHash') && s.includes('sourceHash()')],
  ["postinstall delegates to Prisma ensure", "scripts/postinstall.mjs", (s) => s.includes('ensure-prisma-client.mjs')],
  ["route contract permits PUT", "apps/backend/src/routing/routes.ts", (s) => s.includes('"GET" | "POST" | "PUT" | "PATCH" | "DELETE"')],
  ["Prisma transaction client derives from generated PrismaClient", "packages/database/src/prisma.ts", (s) => s.includes('Omit<PrismaClient') && !s.includes('Prisma.TransactionClient;')],
];
let failed = false;
for (const [label, file, predicate] of checks) {
  if (!fs.existsSync(file)) { console.error(`FAIL ${label}: missing ${file}`); failed = true; continue; }
  const source = fs.readFileSync(file, "utf8");
  const ok = predicate(source);
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  failed ||= !ok;
}
if (failed) process.exit(1);
console.log("DEV_STACK_RECOVERY_PRODUCTION_CHECK_PASS");
