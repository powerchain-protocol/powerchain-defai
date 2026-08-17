import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const runtime = read("apps/bridge/components/wallet/sui-wallet-runtime.tsx");
const kit = read("apps/bridge/lib/wallet/sui-dapp-kit.ts");
const errors = [];

if (!kit.includes("export const suiDAppKit = createPowerChainSuiDAppKit();")) errors.push("Canonical Sui dApp Kit must be created at module scope");
if (!runtime.includes("useEffect(() =>")) errors.push("Custom Sui dApp Kit changes must occur after React commit");
if (!runtime.includes("createPowerChainSuiDAppKit(endpoint)")) errors.push("Custom Sui RPC must still create an endpoint-specific dApp Kit instance");
if (/useMemo\s*\(\s*\(\)\s*=>\s*createPowerChainSuiDAppKit/.test(runtime)) errors.push("createDAppKit must not run from useMemo/render");
if (/useState\s*\(\s*\(\)\s*=>\s*createPowerChainSuiDAppKit/.test(runtime)) errors.push("createDAppKit must not run from a render-phase state initializer");
if (!runtime.includes("<DAppKitProvider dAppKit={runtime.kit}")) errors.push("Sui runtime must provide the post-commit kit instance");

if (errors.length) {
  for (const error of errors) console.error(error);
  process.exit(1);
}
console.log("Sui wallet React lifecycle production check PASS — dApp Kit creation is outside render-phase updates");
