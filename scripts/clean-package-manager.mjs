import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
for (const name of ["package-lock.json", "npm-shrinkwrap.json", "yarn.lock"]) {
  const file = path.join(root, name);
  if (fs.existsSync(file)) { fs.rmSync(file, { force: true }); console.log(`removed ${name}`); }
}
const ignored = path.join(root, "node_modules", ".ignored");
if (fs.existsSync(ignored)) fs.rmSync(ignored, { recursive: true, force: true });
console.log("package-manager cleanup complete; use pnpm install");
