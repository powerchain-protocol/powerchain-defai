import { spawnSync } from "node:child_process";

const executable = process.platform === "win32" ? "next.cmd" : "next";
const result = spawnSync(executable, process.argv.slice(2), {
  stdio: "inherit",
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});

if (result.error) {
  console.error(`Unable to launch Next.js: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
