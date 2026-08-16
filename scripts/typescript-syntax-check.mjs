import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");

const root = process.cwd();
const files = [];
for (const start of ["apps", "packages", "shared/blockchain", "clusters"]) {
  const base = path.join(root, start);
  if (!fs.existsSync(base)) continue;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".next", "dist", "build", "generated"].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) files.push(full);
    }
  };
  walk(base);
}
let failures = 0;
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      isolatedModules: true,
    },
  });
  for (const diagnostic of result.diagnostics ?? []) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
    failures += 1;
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
    const pos = diagnostic.file && diagnostic.start != null ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start) : null;
    console.error(`FAIL ${path.relative(root, file)}${pos ? `:${pos.line + 1}:${pos.character + 1}` : ""} ${message}`);
  }
}
if (failures) process.exit(1);
console.log(`POWERCHAIN_TYPESCRIPT_SYNTAX_CHECK_PASS files=${files.length} typescript=${ts.version}`);
