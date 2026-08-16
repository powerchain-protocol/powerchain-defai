import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const exists = (rel) => fs.existsSync(path.join(root, rel));
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const requireFile = (rel) => { if (!exists(rel)) errors.push(`missing:${rel}`); };
const requireText = (rel, token) => { requireFile(rel); if (exists(rel) && !read(rel).includes(token)) errors.push(`missing-token:${rel}:${token}`); };

for (const rel of [
  "apps/backend/src/swap/cetus.ts",
  "apps/backend/src/payments/payer.ts",
  "apps/backend/src/fees/token2022-transfer-fee.ts",
  "apps/backend/src/fees/token2022-harvest.ts",
  "apps/bridge/lib/swap/swap.ts",
  "apps/bridge/lib/payments/payer.ts",
  "apps/bridge/components/trade/swap-interface.tsx",
  "apps/bridge/components/trade/swap-settings.tsx",
  "apps/bridge/components/trade/trade-workspace.tsx",
  "apps/bridge/components/trade/transaction-fee-summary.tsx",
  "apps/bridge/app/swap/page.tsx",
  "apps/bridge/app/api/v1/swap/quote/route.ts",
  "apps/bridge/app/api/v1/swap/balance/route.ts",
  "apps/bridge/app/api/v1/swap/transaction/route.ts",
  "apps/bridge/app/api/v1/fees/token-2022/route.ts",
]) requireFile(rel);

requireText("apps/backend/package.json", '"@cetusprotocol/aggregator-sdk": "1.6.1"');
requireText("apps/backend/src/swap/cetus.ts", "overlayFeeRate: SWAP_FEE_RATE");
requireText("apps/backend/src/swap/cetus.ts", "overlayFeeReceiver: feeReceiver()");
requireText("apps/backend/src/swap/cetus.ts", "sponsored: false");
requireText("apps/backend/src/swap/cetus.ts", "transaction.setSender(result.quote.payer)");
requireText("apps/backend/src/swap/cetus.ts", "assertMinimumOutput");
requireText("packages/swap-core/src/swap.ts", "SWAP_PRICE_PROTECTION_TRIGGERED");
requireText("apps/backend/src/swap/cetus.ts", "SWAP_INSUFFICIENT_BALANCE");
requireText("apps/backend/src/swap/cetus.ts", "SWAP_SUI_GAS_RESERVE_REQUIRED");
requireText("apps/backend/src/swap/cetus.ts", "getPowerChainSuiBalance");
requireText("apps/bridge/components/trade/swap-interface.tsx", "signAndExecuteTransaction");
requireText("apps/bridge/components/trade/swap-interface.tsx", "Review swap");
requireText("apps/bridge/components/trade/swap-interface.tsx", "Confirm & open wallet");
requireText("apps/bridge/components/trade/swap-interface.tsx", "Payer & signer");
requireText("apps/bridge/components/trade/swap-interface.tsx", "Aggregator route deviation");
requireText("apps/bridge/components/trade/swap-interface.tsx", "Source balance verified");
requireText("apps/bridge/components/trade/swap-interface.tsx", "Balance preflight is unavailable");
requireText("apps/bridge/components/trade/swap-interface.tsx", "exact Max action is intentionally unavailable");
requireText("apps/bridge/components/trade/swap-interface.tsx", "Verify execution status before treating the operation as final");
requireText("apps/bridge/components/trade/swap-interface.tsx", "suiscanTransactionUrl");
requireText("apps/bridge/components/trade/swap-interface.tsx", 'status !== "signing"');
requireText("apps/bridge/components/trade/swap-interface.tsx", 'aria-modal="true"');
requireText("apps/bridge/components/trade/swap-interface.tsx", 'document.body.style.overflow = "hidden"');
requireText("apps/bridge/components/trade/trade-workspace.tsx", "Finality verified");
requireText("apps/bridge/components/trade/swap-interface.tsx", "minimumOutBaseUnits: quote.minimumOutBaseUnits");
requireText("apps/bridge/components/trade/swap-settings.tsx", "Slippage tolerance");
requireText("apps/bridge/components/trade/swap-settings.tsx", "MEV-aware price protection");
requireText("apps/bridge/components/trade/swap-settings.tsx", "does not claim private order flow or a private relay");
requireText("apps/bridge/components/trade/trade-workspace.tsx", '["swap", "bridge"]');
requireText("apps/backend/src/payments/payer.ts", "PAYER_CONNECTED_WALLET_MISMATCH");
requireText("apps/bridge/lib/payments/payer.ts", "PAYER_CONNECTED_WALLET_MISMATCH");
requireText("apps/backend/src/fees/token2022-transfer-fee.ts", "REQUIRED_PWRC_TRANSFER_FEE_BPS = 250");
requireText("apps/backend/src/fees/token2022-transfer-fee.ts", "getTransferFeeConfig");
requireText("apps/backend/src/fees/token2022-harvest.ts", "createHarvestWithheldTokensToMintInstruction");
requireText("apps/backend/src/fees/token2022-harvest.ts", "createWithdrawWithheldTokensFromMintInstruction");
requireText(".env.example", "POWERCHAIN_PWRC_FEE_RECEIVER_TOKEN_ACCOUNT=");
requireText(".env.example", "POWERCHAIN_PWRC_WITHDRAW_WITHHELD_AUTHORITY=");
requireText(".env.example", "POWERCHAIN_SOLANA_PWRC_FEE_MODE=token-2022-native");
requireText(".env.example", "POWERCHAIN_SWAP_FEE_SUI_WALLET=");

const pkg = JSON.parse(read("package.json"));
if (pkg.version !== "1.0.0") errors.push(`version:${pkg.version}`);
if (pkg.scripts?.["swap:production:check"] !== "node scripts/swap-production-check.mjs") errors.push("script:swap:production:check");
if (!String(pkg.scripts?.["verify:production"] ?? "").includes("swap:production:check")) errors.push("verify:production:missing-swap-gate");

if (errors.length) {
  console.error(JSON.stringify({ ok: false, version: "1.0.0", errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, version: "1.0.0", checks: [
  "Swap/Bridge tabbed workspace with transaction safeguards",
  "two-step swap review before wallet invocation",
  "aggregator route deviation surfaced when provided",
  "server-backed source-balance preflight and gas-reserve safety",
  "exact Max action for non-gas swap assets",
  "non-dismissible active wallet prompt and explorer-linked submission receipt",
  "Cetus quote + wallet transaction build",
  "1-500 bps slippage bounds",
  "MEV-aware minimum-output protection without private-relay claims",
  "2.5% Sui swap overlay fee receiver",
  "PWRC Token-2022 250 bps fee configuration inspection",
  "Token-2022 withheld-fee harvest/withdraw plan",
  "connected-wallet payer validation",
  "wallet-owned signature and network fee policy",
] }, null, 2));
