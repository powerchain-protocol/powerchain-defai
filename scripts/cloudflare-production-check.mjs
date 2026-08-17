import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "apps/bridge/open-next.config.ts",
  "apps/bridge/wrangler.jsonc",
  "apps/bridge/public/_headers",
  "apps/bridge/.dev.vars.example",
  "docs/CLOUDFLARE.md",
];

const failures = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`missing ${file}`);
}

const bridgePackage = JSON.parse(fs.readFileSync(path.join(root, "apps/bridge/package.json"), "utf8"));
if (bridgePackage.dependencies?.["@opennextjs/cloudflare"] !== "1.20.2") failures.push("pin @opennextjs/cloudflare@1.20.2");
if (bridgePackage.devDependencies?.wrangler !== "4.120.0") failures.push("pin wrangler@4.120.0");
for (const script of ["preview:cloudflare", "deploy:cloudflare", "upload:cloudflare", "cloudflare:typegen"]) {
  if (!bridgePackage.scripts?.[script]) failures.push(`missing bridge script ${script}`);
}

const wrangler = fs.readFileSync(path.join(root, "apps/bridge/wrangler.jsonc"), "utf8");
for (const token of ["POWERCHAIN_RUNTIME_PLATFORM", "nodejs_compat", '"main": ".open-next/worker.js"', '"directory": ".open-next/assets"', '"enabled": true']) {
  if (!wrangler.includes(token)) failures.push(`wrangler config missing ${token}`);
}

const nextConfig = fs.readFileSync(path.join(root, "apps/bridge/next.config.ts"), "utf8");
if (!nextConfig.includes("initOpenNextCloudflareForDev")) failures.push("Next dev config is not initialized for Cloudflare bindings");

const appFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) appFiles.push(full);
  }
}
walk(path.join(root, "apps/bridge/app"));
for (const file of appFiles) {
  const source = fs.readFileSync(file, "utf8");
  if (/export\s+const\s+runtime\s*=\s*["']edge["']/.test(source)) {
    failures.push(`unsupported edge runtime declaration in ${path.relative(root, file)}`);
  }
}

const headers = fs.readFileSync(path.join(root, "apps/bridge/public/_headers"), "utf8");
if (!headers.includes("/_next/static/*") || !headers.includes("immutable")) failures.push("immutable Next static asset cache headers missing");

if (failures.length) {
  console.error("Cloudflare production check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Cloudflare production check passed (${required.length} required artifacts, ${appFiles.length} app source files scanned).`);
