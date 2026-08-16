import fs from "node:fs";
const required = [
  "packages/swap-core/package.json",
  "packages/swap-core/src/swap.ts",
  "packages/swap-core/src/slippages.ts",
  "apps/backend/src/swap/index.ts",
  "apps/backend/src/swap/solana.ts",
  "apps/backend/src/swap/cetus.ts",
  "apps/bridge/lib/swap/swap.ts",
  "packages/sdk/src/swap-client.ts",
  "docs/SWAP_CORE_ARCHITECTURE.md",
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`SWAP_CORE_FILE_MISSING:${file}`);
const pkg = JSON.parse(fs.readFileSync("packages/swap-core/package.json", "utf8"));
if (pkg.name !== "@powerchain/swap-core" || pkg.version !== "1.0.0") throw new Error("SWAP_CORE_PACKAGE_INVALID");
const core = fs.readFileSync("packages/swap-core/src/swap.ts", "utf8") + "\n" + fs.readFileSync("packages/swap-core/src/slippages.ts", "utf8");
for (const token of [
  "DEFAULT_SWAP_SLIPPAGE_BPS",
  "SWAP_SLIPPAGE_PRESETS_BPS",
  "POWERCHAIN_SWAP_FEE_BPS = 250",
  "canonicalSwapIntent",
  "minimumOutputBaseUnits",
  "assertMinimumOutput",
  "swapQuoteProtection",
  "isSwapQuoteFresh",
  "assertSwapStateTransition",
  "BigInt",
]) if (!core.includes(token)) throw new Error(`SWAP_CORE_INVARIANT_MISSING:${token}`);
const solana = fs.readFileSync("apps/backend/src/swap/solana.ts", "utf8");
const sui = fs.readFileSync("apps/backend/src/swap/cetus.ts", "utf8");
if (!solana.includes("canonicalSwapIntent")) throw new Error("SOLANA_SWAP_MUST_USE_SWAP_CORE");
if (!sui.includes("canonicalSwapIntent") || !sui.includes("swapQuoteProtection") || !sui.includes("assertMinimumOutput")) throw new Error("SUI_SWAP_MUST_USE_SWAP_CORE");
const ui = fs.readFileSync("apps/bridge/lib/swap/swap.ts", "utf8");
if (!ui.includes('@powerchain/swap-core')) throw new Error("SWAP_UI_MUST_USE_SWAP_CORE");
const sdk = fs.readFileSync("packages/sdk/src/swap-client.ts", "utf8");
if (!sdk.includes('@powerchain/swap-core')) throw new Error("SWAP_SDK_MUST_USE_SWAP_CORE_TYPES");
const next = fs.readFileSync("apps/bridge/next.config.ts", "utf8");
if (!next.includes('@powerchain/swap-core')) throw new Error("NEXT_MUST_TRANSPILE_SWAP_CORE");
console.log("swap-core-production-check: PASS");
