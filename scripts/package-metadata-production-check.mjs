import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", ".next", ".open-next", "dist", "build", "coverage", ".turbo"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.name === "package.json") packageFiles.push(absolute);
  }
}

walk(root);
const failures = [];
const licenseFile = path.join(root, "LICENSE");
if (!fs.existsSync(licenseFile)) failures.push("LICENSE: required for MIT-licensed workspaces");
else {
  const license = fs.readFileSync(licenseFile, "utf8");
  if (!license.includes("MIT License") || !license.includes("Copyright (c) 2026 PowerChain")) failures.push("LICENSE: canonical PowerChain MIT text missing");
}
for (const file of packageFiles) {
  const relative = path.relative(root, file);
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  if (typeof pkg.description !== "string" || pkg.description.trim().length < 20) failures.push(`${relative}: missing meaningful description`);
  if (pkg.license !== "MIT") failures.push(`${relative}: workspace must use license=MIT`);
  const authorName = typeof pkg.author === "string" ? pkg.author : pkg.author?.name;
  if (authorName !== "PowerChain") failures.push(`${relative}: author must be PowerChain`);
  if (pkg.private !== true) failures.push(`${relative}: workspace must remain private`);
  if (pkg.engines?.node !== ">=24 <26") failures.push(`${relative}: engines.node must be >=24 <26`);
  if (pkg.engines?.pnpm !== ">=11.22.0 <12") failures.push(`${relative}: engines.pnpm must be >=11.22.0 <12`);
}

if (failures.length) {
  console.error(`package metadata check failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`package metadata check passed (${packageFiles.length} package manifests)`);
