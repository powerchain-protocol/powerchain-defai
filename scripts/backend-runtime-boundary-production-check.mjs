import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const backend = path.join(root, "apps/backend/src");
const bridge = path.join(root, "apps/bridge");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() ? [full] : [];
  });
}

for (const file of walk(backend).filter((file) => /\.[cm]?[jt]sx?$/.test(file))) {
  const text = fs.readFileSync(file, "utf8");
  if (/import\s+["']server-only["']/.test(text)) {
    failures.push(`${path.relative(root, file)} imports Next.js-only server-only but @powerchain/backend is also executed by Node/tsx workers`);
  }
}

for (const file of walk(bridge).filter((file) => /\.[jt]sx$/.test(file))) {
  const text = fs.readFileSync(file, "utf8");
  if (!/^\s*["']use client["'];/m.test(text)) continue;
  if (/from\s+["']@powerchain\/backend(?:\/[^"']*)?["']/.test(text) || /import\(["']@powerchain\/backend/.test(text)) {
    failures.push(`${path.relative(root, file)} is a Client Component and imports @powerchain/backend; move the contract/helper to a browser-safe shared package`);
  }
}

for (const workerDir of ["apps/worker-claims", "apps/worker-fees", "apps/worker-bridge"]) {
  const dir = path.join(root, workerDir);
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir).filter((file) => /\.[cm]?[jt]sx?$/.test(file))) {
    const text = fs.readFileSync(file, "utf8");
    if (/from\s+["']@powerchain\/backend["']/.test(text) || /import\(["']@powerchain\/backend["']\)/.test(text)) {
      failures.push(`${path.relative(root, file)} imports the backend root barrel; workers must use dedicated Node-safe subpath exports`);
    }
  }
}

if (failures.length) {
  console.error("Backend runtime boundary check failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log("✓ Backend runtime boundary: no Next-only marker in backend, no backend imports in Client Components, and workers use dedicated backend subpaths.");
