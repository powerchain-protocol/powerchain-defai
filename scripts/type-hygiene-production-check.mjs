import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const json = (rel) => JSON.parse(read(rel));

function walk(dir, filter, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "build", ".git"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, filter, out);
    else if (filter(full)) out.push(full);
  }
  return out;
}

const tsconfigs = walk(root, (p) => /^tsconfig.*\.json$/.test(path.basename(p)));
for (const file of tsconfigs) {
  const raw = fs.readFileSync(file, "utf8");
  const config = JSON.parse(raw);
  if (Object.prototype.hasOwnProperty.call(config.compilerOptions ?? {}, "baseUrl")) {
    errors.push(`${path.relative(root, file)}: deprecated compilerOptions.baseUrl is forbidden`);
  }
}

const serverProjects = [
  "apps/backend/tsconfig.json",
  "apps/worker-claims/tsconfig.json",
  "apps/worker-fees/tsconfig.json",
  "packages/database/tsconfig.json",
  "packages/runtime/tsconfig.json",
  "packages/protocol/tsconfig.json",
];
for (const rel of serverProjects) {
  const types = json(rel).compilerOptions?.types ?? [];
  if (!types.includes("node")) errors.push(`${rel}: compilerOptions.types must include node`);
}
const bridgeTypes = json("apps/bridge/tsconfig.json").compilerOptions?.types ?? [];
for (const required of ["node", "react"]) {
  if (!bridgeTypes.includes(required)) errors.push(`apps/bridge/tsconfig.json: types must include ${required}`);
}

const source = walk(root, (p) => /\.(?:ts|tsx)$/.test(p));
for (const file of source) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, "utf8");
  if (/from\s+["']@mysten\/sui\/client["']/.test(text) || /\bSuiClient\b/.test(text)) {
    errors.push(`${rel}: legacy SuiClient usage is forbidden; use SuiGrpcClient from @mysten/sui/grpc`);
  }
  if (/\$transaction\(async\s*\(tx\)\s*=>/.test(text)) {
    errors.push(`${rel}: Prisma transaction callback tx must have an explicit transaction-client type`);
  }
  if (/\$queryRaw\s*</.test(text)) {
    errors.push(`${rel}: avoid generic type arguments on $queryRaw; cast the awaited result instead for robust editor typing`);
  }
  const isBridgeClientCandidate = rel.startsWith(`apps${path.sep}bridge${path.sep}`)
    && !rel.includes(`${path.sep}server${path.sep}`)
    && !rel.includes(`${path.sep}app${path.sep}api${path.sep}`);
  if (isBridgeClientCandidate) {
    const usesClientApi = /\b(?:useState|useEffect|useLayoutEffect|useReducer|useRef|useContext|useSyncExternalStore)\s*\(|\b(?:window|document|navigator|localStorage|sessionStorage)\b/.test(text);
    const hasClientDirective = /^\s*["']use client["'];?/.test(text);
    if (usesClientApi && !hasClientDirective) errors.push(`${rel}: client hook/browser API requires a use client boundary`);
  }
}

const bridgePackage = json("apps/bridge/package.json");
for (const dep of ["next", "server-only", "@solana/web3.js", "bs58", "tweetnacl", "@mysten/sui"]) {
  if (!(dep in (bridgePackage.dependencies ?? {}))) errors.push(`apps/bridge/package.json: missing dependency ${dep}`);
}
if (!((bridgePackage.devDependencies ?? {})["@types/node"])) errors.push("apps/bridge/package.json: missing @types/node");

const mdFiles = walk(root, (p) => p.endsWith(".md"));
const heading = /^#{1,6}\s+\S/;
const list = /^\s{0,3}(?:[-+*]|\d+[.)])\s+\S/;
for (const file of mdFiles) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  let fenced = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(?:```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    if (heading.test(line)) {
      if (i > 0 && lines[i - 1].trim()) errors.push(`${path.relative(root, file)}:${i + 1}: MD022 blank required above heading`);
      if (i + 1 < lines.length && lines[i + 1].trim()) errors.push(`${path.relative(root, file)}:${i + 1}: MD022 blank required below heading`);
    }
    if (list.test(line)) {
      const prevList = i > 0 && list.test(lines[i - 1]);
      const nextList = i + 1 < lines.length && list.test(lines[i + 1]);
      if (!prevList && i > 0 && lines[i - 1].trim()) errors.push(`${path.relative(root, file)}:${i + 1}: MD032 blank required above list`);
      if (!nextList && i + 1 < lines.length && lines[i + 1].trim() && !/^\s{2,}\S/.test(lines[i + 1])) errors.push(`${path.relative(root, file)}:${i + 1}: MD032 blank required below list`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`type-hygiene production check PASS (${source.length} TS/TSX files, ${mdFiles.length} Markdown files)`);
