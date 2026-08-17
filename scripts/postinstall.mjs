import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ensure = path.join(repoRoot, "scripts", "ensure-prisma-client.mjs");
const result = spawnSync(process.execPath, [ensure], { cwd: repoRoot, stdio: "inherit", env: process.env });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("[postinstall] Prisma client verified/generated without requiring a live DATABASE_URL.");
