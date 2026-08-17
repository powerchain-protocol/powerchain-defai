import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const workspacePath = path.join(root, "pnpm-workspace.yaml");
const text = fs.readFileSync(workspacePath, "utf8");

const requiredTrue = [
  "linkWorkspacePackages",
  "preferWorkspacePackages",
  "saveWorkspaceProtocol",
  "sharedWorkspaceLockfile",
  "recursiveInstall",
  "disallowWorkspaceCycles",
  "failIfNoMatch",
  "engineStrict",
  "strictPeerDependencies",
  "dedupePeerDependents",
  "resolvePeersFromWorkspaceRoot",
  "dedupeDirectDeps",
  "hoistWorkspacePackages",
  "verifyStoreIntegrity",
  "strictStorePkgContentCheck",
  "preferFrozenLockfile",
  "optimisticRepeatInstall",
  "dedupeInjectedDeps",
  "strictDepBuilds",
];

const errors = [];
if (!/^verifyDepsBeforeRun:\s*warn\s*$/m.test(text)) errors.push("verifyDepsBeforeRun must be warn so bootstrap/repair scripts cannot recursively trigger pnpm install");
for (const key of requiredTrue) {
  if (!new RegExp(`^${key}:\\s*true\\s*$`, "m").test(text)) {
    errors.push(`${key} must be explicitly true in pnpm-workspace.yaml`);
  }
}

if (/^injectWorkspacePackages:\s*true\s*$/m.test(text)) {
  errors.push("injectWorkspacePackages must not be enabled for this live-source workspace");
}

const workspacePackageJsonFiles = [];
const collectPackageJson = (relativeRoot) => {
  const parent = path.join(root, relativeRoot);
  if (!fs.existsSync(parent)) return;
  for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "node_modules") continue;
    const packagePath = path.join(parent, entry.name, "package.json");
    if (fs.existsSync(packagePath)) workspacePackageJsonFiles.push(packagePath);
  }
};
for (const rel of ["apps", "packages", "api"]) collectPackageJson(rel);
for (const rel of ["shared/blockchain/package.json", "clusters/package.json", "api/package.json"]) {
  const packagePath = path.join(root, rel);
  if (fs.existsSync(packagePath)) workspacePackageJsonFiles.push(packagePath);
}

for (const packagePath of [...new Set(workspacePackageJsonFiles)]) {
  const rel = path.relative(root, packagePath);
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  if (pkg.version !== "1.0.0") errors.push(`${rel} version must remain 1.0.0`);
  for (const section of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
      if (name.startsWith("@powerchain/") && !String(spec).startsWith("workspace:")) {
        errors.push(`${rel} ${section}.${name} must use workspace:`);
      }
    }
  }
}

const rootPkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (rootPkg.version !== "1.0.0") errors.push("root version must remain 1.0.0");
if (rootPkg.packageManager !== "pnpm@11.22.0") errors.push("packageManager must be pnpm@11.22.0");
if (rootPkg.engines?.pnpm !== ">=11.22.0 <12") errors.push("engines.pnpm must be >=11.22.0 <12");

if (errors.length) {
  console.error("Workspace configuration check FAILED:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log(`Workspace configuration check PASS (${requiredTrue.length} explicit true settings, ${new Set(workspacePackageJsonFiles).size} workspace manifests, canonical workspace protocol, version 1.0.0).`);
