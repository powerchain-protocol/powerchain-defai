import fs from "node:fs";
const required = [
  "packages/protocol/src/addresses.ts", "packages/protocol/src/integrations.ts", "packages/protocol/src/explorers.ts",
  "packages/protocol/src/fees.ts", "packages/protocol/src/transactions.ts", "packages/protocol/src/validate.ts", "packages/protocol/src/signatures.ts",
  "programs/solana/Anchor.toml", "programs/solana/powerchain_bridge/src/lib.rs",
  "contracts/sui/powerchain_bridge/Move.toml", "contracts/sui/powerchain_bridge/sources/powerchain_bridge.move",
  "apps/bridge/components/ui/toast.tsx", "apps/bridge/lib/toast.ts",
  "apps/bridge/components/wallet/wallet-provider.tsx", "apps/bridge/components/wallet/wallet-connect-modal.tsx",
  "prisma/migrations/20260815000400_protocol_deployments/migration.sql",
  "supabase/migrations/20260815000400_protocol_deployments.sql"
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`Missing protocol file: ${file}`);
const rootPackage = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (rootPackage.version !== "1.0.0") throw new Error("ROOT_VERSION_MUST_REMAIN_1.0.0");
if (rootPackage.engines?.node !== ">=24.0.0 <27") throw new Error("NODE_ENGINE_RANGE_MISMATCH");
const all = [...fs.readdirSync("apps", { withFileTypes: true }).filter(e=>e.isDirectory()).map(e=>`apps/${e.name}/package.json`), ...fs.readdirSync("packages", { withFileTypes: true }).filter(e=>e.isDirectory()).map(e=>`packages/${e.name}/package.json`)];
for (const file of all) if (fs.existsSync(file)) { const p=JSON.parse(fs.readFileSync(file,"utf8")); if (p.version !== "1.0.0") throw new Error(`${file}: version must be 1.0.0`); }
const tsconfigs = [];
function walk(dir){ for(const e of fs.readdirSync(dir,{withFileTypes:true})){ if(["node_modules",".next","target"].includes(e.name)) continue; const f=`${dir}/${e.name}`; if(e.isDirectory()) walk(f); else if(/^tsconfig.*\.json$/.test(e.name)) tsconfigs.push(f); }}
walk(".");
for(const file of tsconfigs){ const t=JSON.parse(fs.readFileSync(file,"utf8")); if(t.compilerOptions?.baseUrl) throw new Error(`${file}: deprecated baseUrl forbidden`); }
console.log(`protocol-production-check: PASS (${required.length} required files, ${tsconfigs.length} tsconfigs)`);
