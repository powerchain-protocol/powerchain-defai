import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", ".next", "target"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".md")) files.push(full);
  }
}

walk(root);
let changed = 0;

for (const file of files) {
  const original = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const lines = original.split("\n");
  const output = [];
  let fence = false;
  let blankRun = 0;

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (!fence && line.trim() === "") {
      blankRun += 1;
      if (blankRun > 1) continue;
    } else {
      blankRun = 0;
    }
    output.push(line.replace(/[ \t]+$/g, ""));
  }

  const normalized = `${output.join("\n").replace(/\n*$/g, "")}\n`;
  if (normalized !== original) {
    fs.writeFileSync(file, normalized);
    changed += 1;
  }
}

console.log(`markdown-fix: normalized ${changed} of ${files.length} Markdown files`);
