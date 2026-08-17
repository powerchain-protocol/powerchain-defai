import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const json = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

const rootPackage = json("package.json");
const backend = json("apps/backend/package.json");
const bridge = json("apps/bridge/package.json");
const blockchain = json("shared/blockchain/package.json");
const manifests = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", ".next", "dist", "build"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(absolute);
    else if (entry.name === "package.json") manifests.push(absolute);
  }
}
collect(root);

must(rootPackage.engines?.node === ">=24 <26", "backend/runtime engine must allow Node >=24 <26");
must(rootPackage.dependencies?.["@solana/kit"] === "7.1.0", "root @solana/kit must be 7.1.0");
must(rootPackage.dependencies?.ws === "8.21.3", "root ws must be 8.21.3");
must(rootPackage.devDependencies?.dotenv === "17.4.2", "root dotenv must be 17.4.2");
must(rootPackage.devDependencies?.typescript === "7.0.2", "root TypeScript must be 7.0.2");
must(rootPackage.devDependencies?.tsx === "4.23.12", "root tsx must be 4.23.12");
must(rootPackage.devDependencies?.["@types/node"] === "26.2.0", "root @types/node must remain 26.2.0");

// Keep the default workspace independent of the Cetus SDK/Hermes engine matrix.
// The backend talks only to an operator-configured HTTPS Cetus adapter and never
// forwards a browser-owned credential to an arbitrary provider host.
must(!backend.dependencies?.["@cetusprotocol/aggregator-sdk"], "backend must use the runtime-neutral Cetus adapter boundary, not the SDK dependency chain");
must(backend.dependencies?.axios === "1.19.0", "backend Cetus adapter transport must use axios 1.19.0");
must(read("apps/backend/src/swap/cetus.ts").includes("POWERCHAIN_CETUS_API_URL"), "backend Cetus adapter must remain environment-configured");
must(read("apps/backend/src/swap/cetus.ts").includes("https:"), "backend Cetus adapter must enforce HTTPS");
must(backend.dependencies?.["@mysten/sui"] === "2.26.1", "backend @mysten/sui must be 2.26.1");
must(backend.dependencies?.["@solana/kit"] === "7.1.0", "backend @solana/kit must be 7.1.0");
must(backend.devDependencies?.typescript === "7.0.2", "backend TypeScript must be 7.0.2");
must(backend.devDependencies?.tsx === "4.23.12", "backend tsx must be 4.23.12");
must(backend.devDependencies?.["@types/node"] === "26.2.0", "backend @types/node must be 26.2.0");
must(backend.dependencies?.openai === "7.4.0", "backend openai SDK must be 7.4.0");
must(backend.dependencies?.["@google/genai"] === "2.17.0", "backend @google/genai must be 2.17.0");
must(backend.dependencies?.dotenv === "17.4.2", "backend dotenv must be 17.4.2");
must(backend.dependencies?.ws === "8.21.3", "backend ws must be 8.21.3");
must(backend.dependencies?.["@powerchain/staking"] === "workspace:*", "backend must depend on @powerchain/staking");
must(bridge.dependencies?.["@mysten/sui"] === "2.26.1", "Bridge @mysten/sui must be 2.26.1");
must(blockchain.dependencies?.["@mysten/sui"] === "2.26.1", "shared blockchain @mysten/sui must be 2.26.1");
must(blockchain.dependencies?.["@solana/kit"] === "7.1.0", "shared blockchain @solana/kit must be 7.1.0");
must(read("shared/blockchain/src/solana.ts").includes('from "@solana/kit"'), "shared blockchain must expose canonical Solana Kit primitives");
must(read("apps/backend/src/services/rpc.ts").includes("createSolanaRpc"), "backend RPC health path must use canonical Solana Kit");

for (const manifestPath of manifests) {
  const pkg = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  must(pkg.engines?.node === ">=24 <26", `${path.relative(root, manifestPath)} must use Node >=24 <26`);
  must(pkg.engines?.pnpm === ">=11.22.0 <12", `${path.relative(root, manifestPath)} must use pnpm >=11.22.0 <12`);
  for (const field of ["dependencies", "devDependencies"]) {
    const deps = pkg[field] ?? {};
    if (deps.typescript) must(deps.typescript === "7.0.2", `${path.relative(root, manifestPath)} ${field}.typescript must be 7.0.2`);
    if (deps.tsx) must(deps.tsx === "4.23.12", `${path.relative(root, manifestPath)} ${field}.tsx must be 4.23.12`);
    if (deps["@types/node"]) must(deps["@types/node"] === "26.2.0", `${path.relative(root, manifestPath)} ${field}.@types/node must be 26.2.0`);
    if (deps["@mysten/sui"]) must(deps["@mysten/sui"] === "2.26.1", `${path.relative(root, manifestPath)} ${field}.@mysten/sui must be 2.26.1`);
  }
}

const lockfile = path.join(root, "pnpm-lock.yaml");
if (fs.existsSync(lockfile)) {
  const text = fs.readFileSync(lockfile, "utf8");
  must(!text.includes("@pythnetwork/pyth-sui-js@"), "lockfile must not reintroduce @pythnetwork/pyth-sui-js; PowerChain uses Hermes REST");
  must(!text.includes("@cetusprotocol/aggregator-sdk@"), "default workspace lockfile must not contain Cetus Aggregator SDK");
  must(!text.includes("@mysten/sui@2.24.0"), "lockfile must not retain @mysten/sui 2.24.0");
  must(!text.includes("@solana/kit@7.0.0"), "lockfile must not retain @solana/kit 7.0.0");
}

if (failures.length) {
  for (const failure of failures) console.error(`[backend-stack] ${failure}`);
  process.exit(1);
}
console.log(`BACKEND_STACK_PRODUCTION_CHECK_PASS manifests=${manifests.length} engines=node>=24<26 cetus=remote-adapter sui=2.26.1 solana-kit=7.1.0 typescript=7.0.2`);
