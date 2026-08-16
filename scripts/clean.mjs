import { rm } from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
const targets = [
  "apps/bridge/.next", ".next", "dist", "build", "coverage", ".turbo",
  "apps/bridge/tsconfig.tsbuildinfo", "apps/backend/tsconfig.tsbuildinfo",
  "apps/worker-claims/tsconfig.tsbuildinfo", "apps/worker-fees/tsconfig.tsbuildinfo",
  "packages/database/tsconfig.tsbuildinfo", "packages/runtime/tsconfig.tsbuildinfo",
  "shared/blockchain/tsconfig.tsbuildinfo", "clusters/tsconfig.tsbuildinfo",
  "api/tsconfig.tsbuildinfo", ".vercel"
];
for (const target of targets) await rm(path.join(root, target), { recursive: true, force: true });
console.log(`clean: removed ${targets.length} generated targets`);
