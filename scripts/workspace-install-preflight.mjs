import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const probes = [
  ["apps/web", "next/dist/bin/next"],
  ["apps/bridge", "next/dist/bin/next"],
  ["apps/bridge", "@mysten/dapp-kit-react"],
  ["apps/bridge", "axios"],
  ["apps/backend", "@powerchain/bridge-core"],
  ["apps/backend", "@mysten/sui/grpc"],
  ["apps/backend", "@solana/spl-token"],
  ["apps/backend", "axios"],
  ["packages/database", "@prisma/adapter-pg"],
  ["packages/database", "@prisma/client"],
  ["packages/database", "pg"],
  ["packages/database", "@supabase/supabase-js"],
];
const missing=[];
for (const [workspace, specifier] of probes) {
  const packageFile=path.join(root, workspace, "package.json");
  try { const req=createRequire(packageFile); req.resolve(specifier); }
  catch { missing.push(`${workspace}: ${specifier}`); }
}
if (missing.length) {
  console.error("[workspace:install] Workspace dependencies are incomplete or out of sync.");
  for (const item of missing) console.error(`  - ${item}`);
  console.error("[workspace:install] For local development run:");
  console.error("  pnpm workspace:install:ensure");
  console.error("[workspace:install] For a clean re-resolution run:");
  console.error("  source ./bootstrap.sh");
  console.error("  pnpm workspace:repair");
  console.error("[workspace:install] Or run the complete local bootstrap: bash scripts/dev-stack-bootstrap.sh");
  process.exit(1);
}
if (!fs.existsSync(path.join(root, "node_modules"))) {
  console.error("[workspace:install] Root node_modules is missing; run pnpm workspace:install:ensure (or workspace:repair for a clean re-resolution).");
  process.exit(1);
}
console.log("[workspace:install] Critical workspace dependencies resolve correctly.");
