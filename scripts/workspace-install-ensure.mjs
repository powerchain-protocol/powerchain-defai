import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;
const preflight = path.join(root, "scripts", "workspace-install-preflight.mjs");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const ci = /^(1|true)$/i.test(process.env.CI ?? "");
const autoInstallDisabled = /^(0|false|off)$/i.test(process.env.POWERCHAIN_AUTO_INSTALL ?? "");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: root,
    stdio: options.stdio ?? "inherit",
    env: process.env,
  });
}

function preflightPasses() {
  const result = run(node, [preflight], { stdio: "ignore" });
  return !result.error && result.status === 0;
}

function installWorkspace() {
  const direct = run(pnpmCommand, ["install", "--no-frozen-lockfile"]);
  if (!direct.error && direct.status === 0) return 0;

  if (direct.error?.code === "ENOENT") {
    console.warn("[workspace:ensure] pnpm is not on PATH; using the repository pnpmw bootstrap wrapper.");
    const wrapper = run("bash", [path.join(root, "pnpmw"), "install", "--no-frozen-lockfile"]);
    return wrapper.status ?? 1;
  }
  return direct.status ?? 1;
}

if (preflightPasses()) {
  console.log("[workspace:ensure] Workspace dependencies are ready.");
  process.exit(0);
}

console.warn("[workspace:ensure] Workspace dependencies are missing or stale.");
if (ci || autoInstallDisabled) {
  console.error("[workspace:ensure] Automatic installation is disabled in CI/non-mutating mode.");
  run(node, [preflight]);
  process.exit(1);
}

console.log("[workspace:ensure] Running a local pnpm install from the monorepo root.");
const installStatus = installWorkspace();
if (installStatus !== 0) {
  console.error("[workspace:ensure] Automatic install did not complete successfully.");
  console.error("[workspace:ensure] Run `source ./bootstrap.sh` and then `pnpm workspace:repair` for a clean re-resolution.");
  process.exit(installStatus);
}

if (!preflightPasses()) {
  console.error("[workspace:ensure] pnpm install completed but critical workspace dependencies still do not resolve.");
  run(node, [preflight]);
  console.error("[workspace:ensure] Run `pnpm workspace:repair` to remove stale workspace modules/lockfile and resolve from current manifests.");
  process.exit(1);
}

console.log("[workspace:ensure] Workspace dependencies were installed and verified.");
