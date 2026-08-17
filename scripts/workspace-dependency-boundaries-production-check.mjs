import fs from "node:fs";
import path from "node:path";
import { builtinModules } from "node:module";

const root = process.cwd();
const workspaceRoots = [
  "apps/backend",
  "apps/bridge",
  "apps/chat",
  "apps/staking",
  "apps/worker-bridge",
  "apps/worker-claims",
  "apps/worker-fees",
  "packages/bridge-core",
  "packages/database",
  "packages/protocol",
  "packages/runtime",
  "packages/sdk",
  "packages/swap-core",
  "shared/blockchain",
  "clusters",
];
const builtins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const importPattern = /(?:from\s+|import\s*\(|require\s*\()\s*["']([^"']+)["']/g;

function packageName(specifier) {
  if (specifier.startsWith("@/")) return null;
  if (specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("#")) return null;
  if (specifier.startsWith("node:") || builtins.has(specifier)) return null;
  if (specifier.startsWith("@")) return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/")[0];
}

function walk(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "coverage"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else visit(full);
  }
}

const failures = [];
for (const workspaceRoot of workspaceRoots) {
  const manifestPath = path.join(root, workspaceRoot, "package.json");
  if (!fs.existsSync(manifestPath)) {
    failures.push(`${workspaceRoot}: package.json is missing`);
    continue;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ]);
  const missing = new Map();
  walk(path.join(root, workspaceRoot), (file) => {
    if (!sourceExtensions.has(path.extname(file))) return;
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(importPattern)) {
      const dependency = packageName(match[1]);
      if (!dependency || declared.has(dependency)) continue;
      const files = missing.get(dependency) ?? new Set();
      files.add(path.relative(path.join(root, workspaceRoot), file));
      missing.set(dependency, files);
    }
  });
  for (const [dependency, files] of missing) {
    failures.push(`${manifest.name ?? workspaceRoot}: undeclared dependency ${dependency} used by ${[...files].slice(0, 5).join(", ")}`);
  }

  // Any package loader used by a production `start` command is part of the runtime,
  // not a development-only tool. This catches pruned-production install failures.
  const startScript = manifest.scripts?.start ?? "";
  const runtimeDependencies = new Set(Object.keys(manifest.dependencies ?? {}));
  if (/\btsx\b/.test(startScript) && !runtimeDependencies.has("tsx")) {
    failures.push(`${manifest.name ?? workspaceRoot}: start script requires tsx, but tsx is not declared in dependencies`);
  }
}

if (failures.length) {
  console.error("Workspace dependency boundary check failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log(`WORKSPACE_DEPENDENCY_BOUNDARIES_PRODUCTION_CHECK_PASS workspaces=${workspaceRoots.length}`);
