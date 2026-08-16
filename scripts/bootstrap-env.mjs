import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, ".env");
const candidates = [
  path.join(root, ".env.example"),
  path.join(root, ".env.local.example"),
];

if (fs.existsSync(target)) {
  console.log("Environment already exists: .env (left unchanged)");
  process.exit(0);
}

const source = candidates.find((candidate) => fs.existsSync(candidate));
if (!source) {
  console.error("No environment template found. Expected .env.local.example or .env.example at repository root.");
  process.exit(1);
}

fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
console.log(`Created .env from ${path.basename(source)}. Review values before production use.`);
