import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const required=[
  "DATABASE_URL","POWERCHAIN_PWRC_EXPECTED_SUPPLY_BASE_UNITS","POWERCHAIN_PWRC_EXPECTED_DECIMALS",
  "POWERCHAIN_SERVICE_FEE_SOLANA_WALLET","POWERCHAIN_DB_POOL_MAX","POWERCHAIN_DB_CONNECT_TIMEOUT_MS",
  "POWERCHAIN_DB_IDLE_TIMEOUT_MS","POWERCHAIN_WORKER_HEARTBEAT_MAX_AGE_MS"
];
const canonicalPath=path.join(root,".env.example");
const lines=fs.readFileSync(canonicalPath,"utf8").split(/\r?\n/);
const keys=[];
for(const line of lines){ const m=line.match(/^([A-Z][A-Z0-9_]*)=/); if(m) keys.push(m[1]); }
const duplicates=keys.filter((k,i)=>keys.indexOf(k)!==i);
if(duplicates.length) throw new Error(`Duplicate .env.example keys: ${[...new Set(duplicates)].join(", ")}`);
for(const key of required) if(!keys.includes(key)) throw new Error(`Missing .env.example key: ${key}`);
const canonical=new Set(keys);
for(const file of [".env.example",".env.local.example",".env.production.example","apps/bridge/.env.example"]){
  const full=path.join(root,file);
  if(!fs.existsSync(full)) throw new Error(`Missing ${file}`);
  const localKeys=fs.readFileSync(full,"utf8").split(/\r?\n/).map(l=>l.match(/^([A-Z][A-Z0-9_]*)=/)?.[1]).filter(Boolean);
  const localDuplicates=localKeys.filter((k,i)=>localKeys.indexOf(k)!==i);
  if(localDuplicates.length) throw new Error(`Duplicate ${file} keys: ${[...new Set(localDuplicates)].join(", ")}`);
  for(const key of localKeys) if(!canonical.has(key)) throw new Error(`${file} contains non-canonical env key: ${key}`);
}
console.log(`env-check: PASS (${keys.length} canonical keys)`);
