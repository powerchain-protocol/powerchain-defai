import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
let failures = 0;
let warnings = 0;
const pass = (message) => console.log(`PASS ${message}`);
const warn = (message) => { warnings += 1; console.warn(`WARN ${message}`); };
const fail = (message) => { failures += 1; console.error(`FAIL ${message}`); };

const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const semver = (input) => input.replace(/^v/, "").split(".").map((part) => Number(part));
const nodeVersion = semver(process.version);
if (nodeVersion[0] >= 24 && nodeVersion[0] < 27) pass(`Node ${process.version} satisfies >=24.0.0 <27`);
else fail(`Node ${process.version} is unsupported; use Node 24.x, 25.x, or .nvmrc Node 26.5.0`);

const manifest = readJson("package.json");
if (manifest.packageManager === "pnpm@11.21.0") pass("packageManager is pnpm@11.21.0");
else fail(`packageManager mismatch: ${manifest.packageManager ?? "missing"}`);

const pnpm = spawnSync("pnpm", ["--version"], { cwd: root, encoding: "utf8" });
if (pnpm.status === 0) {
  const version = pnpm.stdout.trim();
  if (version === "11.21.0") pass(`pnpm ${version}`);
  else fail(`pnpm ${version || "unknown"}; expected 11.21.0`);
} else {
  fail("pnpm is unavailable; run: corepack enable && corepack prepare pnpm@11.21.0 --activate");
}

for (const lockfile of ["package-lock.json", "npm-shrinkwrap.json", "yarn.lock"]) {
  if (exists(lockfile)) fail(`${lockfile} found; this is a pnpm-only workspace. Run: pnpm clean:package-manager`);
}
if (exists("node_modules/.ignored")) fail("node_modules/.ignored exists from mixed package-manager installs; clean and reinstall with pnpm");

if (exists("pnpm-lock.yaml")) pass("pnpm-lock.yaml exists");
else warn("pnpm-lock.yaml is missing; run pnpm install to create/refresh the lockfile");

if (exists("node_modules")) pass("root node_modules exists");
else fail("node_modules missing; run pnpm install");

const requiredInstalled = [
  "node_modules/next",
  "node_modules/typescript",
  "node_modules/@types/node",
  "node_modules/prisma",
];
for (const rel of requiredInstalled) {
  if (exists(rel)) pass(`${rel} installed`);
  else warn(`${rel} not visible at root; pnpm may expose it through the app/workspace package instead`);
}

const bridgeRequired = [
  "apps/bridge/node_modules/next",
  "apps/bridge/node_modules/react",
  "apps/bridge/node_modules/react-dom",
  "apps/bridge/node_modules/@types/react",
  "apps/bridge/node_modules/@types/react-dom",
  "apps/bridge/node_modules/@wormhole-foundation/wormhole-connect",
  "apps/bridge/node_modules/@mysten/sui",
];
for (const rel of bridgeRequired) {
  if (exists(rel)) pass(`${rel} installed`);
  else warn(`${rel} is missing; a complete pnpm install should create its workspace link`);
}

const databaseRequired = [
  "packages/database/node_modules/@prisma/adapter-pg",
  "packages/database/node_modules/@prisma/client",
];
for (const rel of databaseRequired) {
  if (exists(rel)) pass(`${rel} installed`);
  else warn(`${rel} missing; run pnpm install before Prisma generation/typecheck`);
}

const generatedClient = "packages/database/src/generated/prisma/client.ts";
if (exists(generatedClient)) pass("Prisma client is generated");
else fail("Prisma client is not generated; run: pnpm prisma:generate");

for (const rel of [".env.example", ".env", ".env.local", ".env.production", "apps/bridge/.env.example"]) {
  if (exists(rel)) pass(`${rel} exists`);
  else fail(`${rel} missing`);
}

const baseTsconfig = fs.readFileSync(path.join(root, "tsconfig.base.json"), "utf8");
if (/"baseUrl"\s*:/.test(baseTsconfig)) fail("tsconfig.base.json still contains deprecated baseUrl");
else pass("TypeScript config has no deprecated baseUrl");

const vercel = fs.readFileSync(path.join(root, "vercel.json"), "utf8");
if (vercel.includes("openapi.vercel.sh")) warn("vercel.json has a remote $schema that some editors mark untrusted");
else pass("vercel.json has no remote schema dependency");

console.log(`\nPowerChain doctor: ${failures} failure(s), ${warnings} warning(s)`);
if (failures > 0) process.exit(1);
