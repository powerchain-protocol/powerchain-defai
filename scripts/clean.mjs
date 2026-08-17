import { rm } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const directoryNames = new Set([
  "node_modules", ".next", ".open-next", "dist", "build", "coverage", ".turbo",
  ".cache", ".vercel", ".parcel-cache", ".eslintcache", "__pycache__"
]);
const exactFiles = new Set([".DS_Store", "Thumbs.db"]);
const suffixes = [".log", ".tmp", ".bak", ".tsbuildinfo"];
const removed = [];

async function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute);
    if (entry.isDirectory() && directoryNames.has(entry.name)) {
      await rm(absolute, { recursive: true, force: true });
      removed.push(relative);
      continue;
    }
    if (entry.isDirectory()) {
      await walk(absolute);
      continue;
    }
    if (exactFiles.has(entry.name) || suffixes.some((suffix) => entry.name.endsWith(suffix))) {
      await rm(absolute, { force: true });
      removed.push(relative);
    }
  }
}

await walk(root);
console.log(`clean: removed ${removed.length} generated/junk targets`);
if (removed.length) console.log(removed.map((entry) => `- ${entry}`).join("\n"));
