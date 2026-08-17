import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoots = ["apps", "packages", "api"];
const extra = ["clusters", "shared/blockchain"];
const failures = [];
const checked = [];

function inspect(dir) {
  const pkgFile = path.join(dir, "package.json");
  const tsconfig = path.join(dir, "tsconfig.json");
  const src = path.join(dir, "src");
  if (!fs.existsSync(pkgFile) || !fs.existsSync(tsconfig) || !fs.existsSync(src)) return;
  const hasTs = fs.readdirSync(src, { recursive: true }).some((name) => /\.tsx?$/.test(String(name)));
  if (!hasTs) return;
  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
  checked.push(pkg.name ?? path.relative(root, dir));
  if (pkg.scripts?.typecheck !== "tsc --noEmit") failures.push(`${pkg.name}: missing canonical typecheck script`);
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  if (!deps.typescript) failures.push(`${pkg.name}: TypeScript dependency missing`);
}

for (const base of workspaceRoots) {
  const full = path.join(root, base);
  if (!fs.existsSync(full)) continue;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) if (entry.isDirectory()) inspect(path.join(full, entry.name));
}
for (const rel of extra) inspect(path.join(root, rel));

if (failures.length) {
  console.error(`workspace-typecheck-coverage: FAIL\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`workspace-typecheck-coverage: PASS (${checked.length} TypeScript workspaces)`);
