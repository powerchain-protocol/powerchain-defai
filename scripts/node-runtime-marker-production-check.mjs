import fs from "node:fs";
const nvm = fs.readFileSync(".nvmrc", "utf8").trim();
const nodeVersion = fs.readFileSync(".node-version", "utf8").trim();
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const failures = [];
if (nvm !== "24.19.0") failures.push(`.nvmrc=${nvm}`);
if (nodeVersion !== "24.19.0") failures.push(`.node-version=${nodeVersion}`);
if (pkg.engines?.node !== ">=24 <26") failures.push(`engines.node=${pkg.engines?.node}`);
if (pkg.engines?.pnpm !== ">=11.22.0 <12") failures.push(`engines.pnpm=${pkg.engines?.pnpm}`);
if (pkg.devEngines?.runtime?.version !== "24.19.0") failures.push(`devEngines.runtime.version=${pkg.devEngines?.runtime?.version} (expected 24.19.0)`);
if (failures.length) { console.error(`Node/runtime marker production check failed: ${failures.join(", ")}`); process.exit(1); }
console.log("Node/runtime marker production check: PASS — Node 24.19.0 pinned; engines Node >=24 <26 / pnpm >=11.22.0 <12");
