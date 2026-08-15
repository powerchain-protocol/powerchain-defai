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
const errors = [];
for (const file of files) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  let fence = false;
  const isList = (line) => /^\s*(?:[-*+] |\d+\. )/.test(line);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; continue; }
    if (fence) continue;
    if (!line.trim() && i > 0 && !lines[i - 1].trim()) errors.push(`${path.relative(root,file)}:${i+1} MD012 no-multiple-blanks`);
    if (/^#{1,6}\s+\S/.test(line)) {
      if (i > 0 && lines[i - 1].trim()) errors.push(`${path.relative(root,file)}:${i+1} MD022 above`);
      if (i + 1 < lines.length && lines[i + 1].trim()) errors.push(`${path.relative(root,file)}:${i+1} MD022 below`);
    }
    if (isList(line)) {
      const start = i === 0 || !isList(lines[i - 1]);
      const end = i + 1 === lines.length || !isList(lines[i + 1]);
      if (start && i > 0 && lines[i - 1].trim()) errors.push(`${path.relative(root,file)}:${i+1} MD032 above`);
      if (end && i + 1 < lines.length && lines[i + 1].trim()) errors.push(`${path.relative(root,file)}:${i+1} MD032 below`);
    }
  }
}
if (errors.length) { console.error(errors.slice(0,100).join("\n")); process.exit(1); }
console.log(`markdown-structure-check: PASS (${files.length} files)`);
