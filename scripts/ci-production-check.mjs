import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const workflowPath = path.join(root, ".github/workflows/ci.yml");
const errors = [];
const must = (condition, message) => { if (!condition) errors.push(message); };

must(fs.existsSync(workflowPath), ".github/workflows/ci.yml must exist");
const rootPackage = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
must(fs.readFileSync(path.join(root, ".node-version"), "utf8").trim() === "24.19.0", "CI Node version marker must pin Node 24.19.0");
must(rootPackage.engines?.node === ">=24 <26", "CI package engine must require Node >=24 <26");
must(rootPackage.engines?.pnpm === ">=11.22.0 <12", "CI package engine must require pnpm >=11.22.0 <12");
if (fs.existsSync(workflowPath)) {
  const workflow = fs.readFileSync(workflowPath, "utf8");
  must(workflow.includes("permissions:\n  contents: read"), "CI must use least-privilege contents: read permissions");
  must(workflow.includes("cancel-in-progress: true"), "CI must cancel superseded branch/PR runs");
  must(workflow.includes("actions/checkout@v7"), "CI must use actions/checkout@v7");
  must(workflow.includes("pnpm/setup@v1"), "CI must use pnpm/setup@v1 for pnpm 11+/Node runtime provisioning");
  must(workflow.includes("version: 11.22.0"), "CI must pin pnpm 11.22.0");
  must(workflow.includes("runtime: node@24.19.0"), "CI must pin Node 24.19.0 through pnpm/setup");
  must(workflow.includes("pnpm install --frozen-lockfile"), "CI installs must be frozen-lockfile only");
  must(workflow.includes("pnpm validate:all"), "CI must run the complete dependency-aware validation gate");
  must(workflow.includes("node scripts/generate-api-registry.mjs --check"), "repository contract job must verify generated API registry drift");
  must(workflow.includes("node scripts/user-settings-production-check.mjs"), "repository contract job must verify user settings/custom API boundaries");
  must(workflow.includes("node scripts/lockfile-production-check.mjs"), "repository contract job must fail closed without a reviewed pnpm lockfile");
  must(!workflow.includes("corepack"), "CI must not depend on Corepack; pnpm/setup provisions the pinned toolchain directly");
  must(!/\bnpm\s+(?:install|ci)\b/.test(workflow), "CI must not install project dependencies with npm");
  must(!/\byarn\s+(?:install|add)\b/.test(workflow), "CI must not install dependencies with Yarn");
  must(!/\bbun\s+(?:install|add)\b/.test(workflow), "CI must not install dependencies with Bun");
  must(workflow.includes("node scripts/runtime-trust-production-check.mjs"), "repository contract job must run runtime trust validation");
}

for (const rel of [".editorconfig", ".gitattributes", ".dockerignore"]) {
  must(fs.existsSync(path.join(root, rel)), `${rel} must exist`);
}

if (errors.length) {
  console.error(`CI production check failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("CI_PRODUCTION_CHECK_PASS workflow=production-ci node=24.19.0 pnpm=11.22.0 provider=pnpm/setup@v1");
