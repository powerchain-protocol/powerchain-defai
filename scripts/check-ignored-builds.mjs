import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(pnpm, ["ignored-builds"], { cwd: root, encoding: "utf8", env: process.env });
if (result.error) throw result.error;
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
if (result.status !== 0) {
  if (output) process.stderr.write(`${output}\n`);
  process.exit(result.status ?? 1);
}
const normalized = output.toLowerCase();
const clean = !output || normalized.includes("no packages") || normalized.includes("no ignored") || normalized.includes("none");
if (!clean) {
  console.error(`[deps:builds:check] Unapproved dependency build scripts remain:\n${output}`);
  process.exit(1);
}
console.log("[deps:builds:check] No ignored dependency build scripts remain.");
