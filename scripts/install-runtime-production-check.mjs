import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const json = (file) => JSON.parse(read(file));
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

const rootPackage = json("package.json");
const bridge = json("apps/bridge/package.json");
const blockchain = json("shared/blockchain/package.json");
const nextCli = read("scripts/next-cli.mjs");
const bootstrapWorkspace = read("scripts/bootstrap-workspace.mjs");
const toolchain = read("scripts/bootstrap-toolchain.sh");
const rootBootstrap = read("bootstrap.sh");
const setup = read("scripts/setup-local.sh");
const repair = read("scripts/repair-workspace.mjs");
const bridgeReadme = read("apps/bridge/README.md");
const devcontainerDockerfile = read(".devcontainer/Dockerfile");

must(read(".nvmrc").trim() === "24.19.0", ".nvmrc must pin Node 24.19.0");
must(read(".node-version").trim() === "24.19.0", ".node-version must pin Node 24.19.0");
must(rootPackage.engines?.node === ">=24 <26", "root Node engine must be >=24 <26");
must(rootPackage.engines?.pnpm === ">=11.22.0 <12", "root pnpm engine must be >=11.22.0 <12");
must(rootPackage.packageManager === "pnpm@11.22.0", "root packageManager must pin pnpm@11.22.0");
must(rootPackage.devEngines?.runtime?.name === "node", "root devEngines.runtime must manage Node");
must(rootPackage.devEngines?.runtime?.version === "24.19.0", "root managed runtime must pin Node 24.19.0 exactly");
must(rootPackage.devEngines?.runtime?.onFail === "download", "root managed runtime must download Node 24.19.0 when the shell runtime differs");
must(read("pnpm-workspace.yaml").includes("runtimeOnFail: download"), "pnpm workspace must force managed runtime download on mismatch");
must(rootPackage.scripts?.["workspace:repair"] === "node scripts/repair-workspace.mjs", "workspace:repair must be source-controlled");
must(String(rootPackage.scripts?.["db:migrate:deploy"] ?? "").startsWith("pnpm db:preflight"), "database deploy migrations must run connectivity preflight first");
must(!bootstrapWorkspace.includes("db:migrate:deploy") && !bootstrapWorkspace.includes("prisma migrate"), "workspace bootstrap must never mutate the database schema");
must(toolchain.includes('POWERCHAIN_NODE_VERSION="24.19.0"') && toolchain.includes('POWERCHAIN_PNPM_VERSION="11.22.0"'), "toolchain bootstrap must pin Node/pnpm");
must(toolchain.includes("SHASUMS256.txt") && toolchain.includes("npm install --global --prefix"), "toolchain bootstrap must verify Node download and install pnpm user-locally");
must(!toolchain.includes("corepack ") && !toolchain.includes("nvm install") && !toolchain.includes("nvm use"), "toolchain bootstrap must not require Corepack or nvm");
must(rootBootstrap.includes("must be sourced") && rootBootstrap.includes("bootstrap-toolchain.sh"), "root bootstrap must preserve toolchain PATH in the current shell");
must(!setup.includes("corepack enable"), "PowerChain setup must not require Corepack; the verified bootstrap provisions pnpm directly");
must(devcontainerDockerfile.includes("ARG PNPM_VERSION=11.22.0") && devcontainerDockerfile.includes('npm install --global "pnpm@${PNPM_VERSION}"'), "devcontainer must provision pnpm 11.22.0 at image build time");
must(repair.includes("pnpm") && repair.includes("--no-frozen-lockfile") && repair.includes("clean.mjs"), "workspace repair must clean and perform pnpm lock refresh");
must(repair.includes("fs.rmSync(lockfilePath") && repair.includes("Removing stale pnpm-lock.yaml"), "workspace repair must discard stale lockfiles before re-resolution");
must(!repair.includes("prisma migrate"), "workspace repair must not run Prisma migrations");
must(nextCli.includes('resolve("next/dist/bin/next")') && nextCli.includes("process.execPath"), "Next launcher must resolve the workspace Next CLI and execute it with current Node");
must(bridge.scripts?.["dev:standalone"] && bridge.scripts?.["build:standalone"] && bridge.scripts?.["start:standalone"], "bridge standalone lifecycle scripts are required");
must(!bridge.dependencies?.["@wormhole-foundation/wormhole-connect"], "broad Wormhole Connect dependency must remain removed from Bridge install surface");
must(!bridge.dependencies?.aptos && !bridge.devDependencies?.aptos, "deprecated aptos package must not be a direct Bridge dependency");
const lockfilePath = path.join(root, "pnpm-lock.yaml");
if (fs.existsSync(lockfilePath)) {
  const lockfile = fs.readFileSync(lockfilePath, "utf8");
  must(!/(?:^|\s)aptos@1\.22\.1(?:\s|:|$)/m.test(lockfile), "pnpm-lock.yaml must not retain deprecated aptos@1.22.1 after workspace repair");
}
must(blockchain.dependencies?.["@mysten/sui"] === "2.26.1", "@powerchain/blockchain must own the pinned Sui SDK");
must(!blockchain.dependencies?.["@pythnetwork/pyth-sui-js"], "@pythnetwork/pyth-sui-js must stay outside the canonical Sui runtime; PowerChain uses @mysten/sui plus Hermes REST");
must(bridgeReadme.includes("pnpm workspace:repair") && bridgeReadme.includes("dev:standalone"), "Bridge README must document recovery and standalone routing");

const allManifestFiles = [];
function collectManifests(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", ".next", "dist", "build"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collectManifests(absolute);
    else if (entry.name === "package.json") allManifestFiles.push(absolute);
  }
}
collectManifests(root);
for (const manifestPath of allManifestFiles) {
  const pkg = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  must(pkg.license === "MIT", `${path.relative(root, manifestPath)} must declare MIT license`);
  must(pkg.engines?.node === ">=24 <26", `${path.relative(root, manifestPath)} must enforce Node >=24 <26`);
  must(pkg.engines?.pnpm === ">=11.22.0 <12", `${path.relative(root, manifestPath)} must enforce pnpm >=11.22.0 <12`);
  for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    const deps = pkg[field] ?? {};
    must(!Object.prototype.hasOwnProperty.call(deps, "aptos"), `${path.relative(root, manifestPath)} must not declare deprecated aptos`);
    must(!Object.prototype.hasOwnProperty.call(deps, "@wormhole-foundation/wormhole-connect"), `${path.relative(root, manifestPath)} must not reintroduce broad Wormhole Connect`);
    must(!Object.prototype.hasOwnProperty.call(deps, "@pythnetwork/pyth-sui-js"), `${path.relative(root, manifestPath)} must not declare @pythnetwork/pyth-sui-js; use the canonical @mysten/sui + Hermes REST boundary`);
  }
}

const license = read("LICENSE");
must(license.startsWith("MIT License") && license.includes("Permission is hereby granted, free of charge"), "root LICENSE must contain the MIT license text");

if (failures.length) {
  for (const failure of failures) console.error(`[install-runtime] ${failure}`);
  process.exit(1);
}
console.log("install/runtime production check: PASS — MIT, Node 24, pnpm 11.22, verified no-nvm/no-Corepack bootstrap, deterministic Next launcher and standalone Bridge lifecycle enforced");
