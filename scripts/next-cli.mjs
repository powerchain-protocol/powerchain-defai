import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

/**
 * Resolve Next from the calling workspace instead of relying on PATH/.bin.
 * This is pnpm-safe and makes filtered/standalone app commands deterministic.
 */
function resolveNextBin() {
  const appPackage = path.join(process.cwd(), "package.json");
  const requireFromApp = createRequire(appPackage);
  try {
    return requireFromApp.resolve("next/dist/bin/next");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error("Unable to resolve the Next.js CLI from the current workspace.");
    console.error(`cwd: ${process.cwd()}`);
    console.error("Run `source ./bootstrap.sh`, then `pnpm workspace:repair` from the monorepo root before starting the app.");
    console.error(`resolver: ${reason}`);
    process.exit(1);
  }
}

const nextBin = resolveNextBin();
const result = spawnSync(process.execPath, [nextBin, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});

if (result.error) {
  console.error(`Unable to launch Next.js: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
