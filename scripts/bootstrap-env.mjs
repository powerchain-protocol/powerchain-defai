import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const copies = [
  { target: ".env", candidates: [".env.example", ".env.local.example", "config/env.defaults"] },
  { target: ".env.local", candidates: [".env.local.example", "config/env.defaults"] },
];

let created = 0;
for (const entry of copies) {
  const target = path.join(repoRoot, entry.target);
  if (fs.existsSync(target)) {
    console.log(`[env:bootstrap] ${entry.target} already exists; leaving it unchanged.`);
    continue;
  }
  const template = entry.candidates.map((name) => path.join(repoRoot, name)).find((candidate) => fs.existsSync(candidate));
  if (!template) {
    throw new Error(`No environment template found for ${entry.target}. Expected ${entry.candidates.join(" or ")} at repository root ${repoRoot}.`);
  }
  fs.copyFileSync(template, target, fs.constants.COPYFILE_EXCL);
  created += 1;
  console.log(`[env:bootstrap] Created ${entry.target} from ${path.basename(template)}.`);
}
if (created === 0) console.log("[env:bootstrap] Environment files are already initialized.");
