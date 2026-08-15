import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
let failed = false;
const pass = (message) => console.log(`PASS ${message}`);
const fail = (message) => { failed = true; console.error(`FAIL ${message}`); };
const check = (condition, message) => condition ? pass(message) : fail(message);
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const packageFiles = [
  "package.json",
  "apps/bridge/package.json",
  "apps/worker-claims/package.json",
  "apps/worker-fees/package.json",
  "apps/backend/package.json",
  "packages/database/package.json",
  "packages/runtime/package.json",
];
for (const rel of packageFiles) {
  const file = path.join(root, rel);
  check(fs.existsSync(file), `${rel} exists`);
  if (fs.existsSync(file)) check(readJson(file).version === "1.0.0", `${rel} stays version 1.0.0`);
}

const tsconfigFiles = [];
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "build"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "tsconfig.json") tsconfigFiles.push(full);
  }
};
for (const dir of ["apps", "packages"]) walk(path.join(root, dir));
for (const file of tsconfigFiles) {
  const data = readJson(file);
  if (typeof data.extends !== "string") continue;
  if (!data.extends.startsWith(".")) continue;
  const target = path.resolve(path.dirname(file), data.extends);
  const candidates = [target, `${target}.json`, path.join(target, "tsconfig.json")];
  check(candidates.some(fs.existsSync), `${path.relative(root, file)} extends an existing config`);
}

for (const rel of [".env.example", "apps/bridge/.env.example"]) {
  const file = path.join(root, rel);
  const seen = new Set();
  const duplicates = [];
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=/);
    if (!match) continue;
    if (seen.has(match[1])) duplicates.push(match[1]);
    seen.add(match[1]);
  }
  check(duplicates.length === 0, `${rel} has no duplicate environment keys${duplicates.length ? `: ${duplicates.join(", ")}` : ""}`);
}

const sourceFiles = [];
const sourceWalk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "build"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceWalk(full);
    else if (/\.(?:ts|tsx|mjs|js)$/.test(entry.name)) sourceFiles.push(full);
  }
};
for (const dir of ["apps", "packages"]) sourceWalk(path.join(root, dir));
const unresolved = [];
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/(?:from\s+|import\s*\()(["'])(\.{1,2}\/[^"']+)\1/g)) {
    const spec = match[2];
    const base = path.resolve(path.dirname(file), spec);
    const candidates = [
      base,
      `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, `${base}.json`,
      path.join(base, "index.ts"), path.join(base, "index.tsx"), path.join(base, "index.js"),
    ];
    const generatedPrismaImport = path.relative(root, file) === "packages/database/src/prisma.ts" && spec === "./generated/prisma/client";
    if (!generatedPrismaImport && !candidates.some(fs.existsSync)) unresolved.push(`${path.relative(root, file)} -> ${spec}`);
  }
}
check(unresolved.length === 0, `all relative source imports resolve${unresolved.length ? `: ${unresolved.slice(0, 10).join("; ")}` : ""}`);

const runtime = fs.readFileSync(path.join(root, "packages/runtime/src/index.ts"), "utf8");
check(runtime.includes("parseBoundedInteger"), "shared runtime provides bounded integer env parsing");
check(runtime.includes("AbortController"), "worker supervisor has cooperative shutdown signal");
check(runtime.includes("POWERCHAIN_WORKER_TICK_FAILED"), "worker supervisor emits structured failure logs");

for (const rel of ["apps/worker-fees/src/main.ts", "apps/worker-claims/src/main.ts"]) {
  const text = fs.readFileSync(path.join(root, rel), "utf8");
  check(text.includes("parseBoundedInteger"), `${rel} uses bounded environment parsing`);
}

if (failed) process.exit(1);
console.log("POWERCHAIN_WORKSPACE_PRODUCTION_CHECK_PASS version=1.0.0");
