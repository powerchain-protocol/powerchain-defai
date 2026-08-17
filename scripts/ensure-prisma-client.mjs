import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = path.join(root, "prisma", "schema.prisma");
const config = path.join(root, "prisma.config.ts");
const generated = path.join(root, "packages", "database", "src", "generated", "prisma", "client.ts");
const generatedRoot = path.join(root, "packages", "database", "src", "generated", "prisma");
const stamp = path.join(generatedRoot, ".source.sha256");
const requiredGeneratedModels = ["BridgeTransfer", "Claim", "BridgeServiceFeeSettlement", "RuntimeMaintenanceState"].map((name) => path.join(generatedRoot, "models", `${name}.ts`));
const lockDir = path.join(root, ".cache", "powerchain", "prisma-generate.lock");
const LOCK_STALE_MS = 120_000;
const WAIT_MS = 250;
const WAIT_LIMIT_MS = 60_000;

function sourceHash() {
  const hash = crypto.createHash("sha256");
  for (const file of [schema, config]) { if (fs.existsSync(file)) hash.update(fs.readFileSync(file)); }
  return hash.digest("hex");
}
function current() {
  if (!fs.existsSync(generated) || !fs.existsSync(stamp) || requiredGeneratedModels.some((file) => !fs.existsSync(file))) return false;
  try { return fs.readFileSync(stamp, "utf8").trim() === sourceHash(); } catch { return false; }
}
function sleep(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
function acquireLock() {
  fs.mkdirSync(path.dirname(lockDir), { recursive: true });
  const started = Date.now();
  while (true) {
    try { fs.mkdirSync(lockDir); fs.writeFileSync(path.join(lockDir, "owner.json"), `${JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() })}\n`); return true; }
    catch (error) {
      if (error?.code !== "EEXIST") throw error;
      if (current()) return false;
      let age=0; try { age=Date.now()-fs.statSync(lockDir).mtimeMs; } catch {}
      if (age > LOCK_STALE_MS) { fs.rmSync(lockDir, { recursive: true, force: true }); continue; }
      if (Date.now() - started >= WAIT_LIMIT_MS) throw new Error("PRISMA_GENERATE_LOCK_TIMEOUT");
      sleep(WAIT_MS);
    }
  }
}
function runGenerate() {
  const requireFromRoot = createRequire(path.join(root, "package.json"));
  let prismaPackage;
  try { prismaPackage = requireFromRoot.resolve("prisma/package.json"); } catch { throw new Error("PRISMA_CLI_NOT_INSTALLED: run pnpm workspace:repair from the monorepo root"); }
  const cli = path.join(path.dirname(prismaPackage), "build", "index.js");
  if (!fs.existsSync(cli)) throw new Error(`PRISMA_CLI_NOT_FOUND:${cli}`);
  const result = spawnSync(process.execPath, [cli, "generate", "--schema", schema], { cwd: root, stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  if (!fs.existsSync(generated)) throw new Error("PRISMA_GENERATED_CLIENT_MISSING_AFTER_GENERATE");
  fs.writeFileSync(stamp, `${sourceHash()}\n`);
}

if (!fs.existsSync(schema)) { console.log("[prisma:ensure] No Prisma schema; nothing to generate."); process.exit(0); }
if (current()) { console.log("[prisma:ensure] Generated Prisma client is current."); process.exit(0); }
const ownsLock = acquireLock();
if (!ownsLock) { console.log("[prisma:ensure] Another process generated the current Prisma client."); process.exit(0); }
try { if (!current()) runGenerate(); if (!current()) throw new Error("PRISMA_GENERATED_CLIENT_STALE_AFTER_GENERATE"); console.log("[prisma:ensure] Generated Prisma client is current."); }
finally { fs.rmSync(lockDir, { recursive: true, force: true }); }
