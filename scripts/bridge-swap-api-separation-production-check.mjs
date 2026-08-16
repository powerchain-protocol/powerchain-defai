import fs from "node:fs";
const checks = [
  ["apps/backend/src/routing/bridge-routes.ts", "/api/v1/bridge/quote"],
  ["apps/backend/src/routing/swap-routes.ts", "/api/v1/swap/quote"],
  ["packages/sdk/src/bridge-client.ts", "class BridgeApiClient"],
  ["packages/sdk/src/swap-client.ts", "class SwapApiClient"],
  ["apps/bridge/app/api/v1/bridge/openapi/route.ts", "BRIDGE_OPENAPI"],
  ["apps/bridge/app/api/v1/swap/openapi/route.ts", "SWAP_OPENAPI"],
  ["api/bridge/openapi.yaml", "PowerChain Bridge API"],
  ["api/swap/openapi.yaml", "PowerChain Swap API"],
  ["api/bridge/package.json", "@powerchain/bridge-api-contracts"],
  ["api/swap/package.json", "@powerchain/swap-api-contracts"],
];
const errors=[]; for(const [file,needle] of checks){if(!fs.existsSync(file)){errors.push(`Missing ${file}`);continue;} if(!fs.readFileSync(file,"utf8").includes(needle))errors.push(`${file} missing ${needle}`);}
const bridge=fs.readFileSync("apps/backend/src/routing/bridge-routes.ts","utf8"); const swap=fs.readFileSync("apps/backend/src/routing/swap-routes.ts","utf8");
if(bridge.includes("/api/v1/swap/"))errors.push("Bridge router contains Swap route"); if(swap.includes("/api/v1/bridge/"))errors.push("Swap router contains Bridge route");
if(errors.length){for(const e of errors)console.error(e);process.exit(1);} console.log("Bridge/Swap API separation PASS");
