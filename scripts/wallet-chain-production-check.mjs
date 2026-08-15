#!/usr/bin/env node
import fs from "node:fs";

let failed = false;
const checks = [
  ["apps/bridge/server/services/helius.ts", ["getTransactionsForAddress", "POWERCHAIN_HELIUS_RPC_API_URL", "getHeliusAddressTransactions", "Compatibility fallback only"]],
  ["apps/bridge/server/services/wallet-data.ts", ["helius-rpc-history", "helius-enhanced-compat", "getSignaturesForAddress", "fallbackReason", "pagination", "sui-graphql", "sui-rpc-compat", "authoritativeForBridgeAccounting: false"]],
  ["apps/bridge/server/services/wallet-activity.ts", ["POWERCHAIN_CLAIM:", "PWRC_TRANSFER", "SUI_ACTIVITY", "mergeWalletActivity"]],
  ["apps/bridge/server/services/wallet-overview.ts", ["Promise.allSettled", "degraded", "mergeWalletActivity", "authoritativeForBridgeAccounting: false"]],
  ["apps/bridge/app/api/v1/wallet/overview/route.ts", ["WALLET_ADDRESS_REQUIRED", "X-PowerChain-Wallet-Status", "no-store"]],
  ["apps/bridge/app/api/v1/wallet/solana/route.ts", ["no-store", "getSolanaWalletOverview"]],
  ["apps/bridge/app/api/v1/wallet/sui/route.ts", ["no-store", "getSuiWalletOverview"]],
  ["apps/bridge/app/api/v1/transactions/solana/[signature]/route.ts", ["getSolanaTransactionDetails", "TRANSACTION_NOT_FOUND"]],
  ["apps/bridge/app/api/v1/transactions/sui/[digest]/route.ts", ["getSuiTransactionDetails", "TRANSACTION_NOT_FOUND"]],
  ["apps/bridge/hooks/use-wallet-chain-data.ts", ["AbortController", "10_000", "cache: \"no-store\""]],
  ["apps/bridge/hooks/use-wallet-overview.ts", ["AbortController", "generation", "wallet/overview", "cache: \"no-store\""]],
  ["apps/bridge/components/wallet/wallet-chain-data-card.tsx", ["useClaimEligibility", "PWRC balance", "Claim eligibility", "Recent transactions", "Explorer"]],
  ["apps/bridge/components/wallet/wallet-activity-card.tsx", ["useWalletOverview", "useClaimEligibility", "Cross-chain wallet activity", "reconciliation-owned"]],
  ["apps/bridge/lib/explorers/links.ts", ["solscan.io", "suiscan.xyz", "solscanTransactionUrl", "suiscanTransactionUrl"]],
];
for (const [file, tokens] of checks) {
  if (!fs.existsSync(file)) { console.error(`FAIL missing ${file}`); failed = true; continue; }
  const text = fs.readFileSync(file, "utf8");
  for (const token of tokens) if (!text.includes(token)) { console.error(`FAIL ${file}: missing ${token}`); failed = true; }
}

const browserFiles = [
  "apps/bridge/hooks/use-wallet-chain-data.ts",
  "apps/bridge/hooks/use-wallet-overview.ts",
  "apps/bridge/components/wallet/wallet-chain-data-card.tsx",
  "apps/bridge/components/wallet/wallet-activity-card.tsx",
  "apps/bridge/lib/explorers/links.ts",
];
for (const file of browserFiles) {
  if (fs.existsSync(file) && /(HELIUS_API_KEY|OPERATOR_API_TOKEN|POWERCHAIN_GOVERNANCE_API_TOKEN|WEBHOOK_SIGNING_SECRET)/.test(fs.readFileSync(file, "utf8"))) {
    console.error(`FAIL secret reference in browser-safe file ${file}`); failed = true;
  }
}

const service = fs.existsSync("apps/bridge/server/services/wallet-data.ts") ? fs.readFileSync("apps/bridge/server/services/wallet-data.ts", "utf8") : "";
const helius = fs.existsSync("apps/bridge/server/services/helius.ts") ? fs.readFileSync("apps/bridge/server/services/helius.ts", "utf8") : "";
if (!service.includes("getHeliusTransactionsForAddress")) { console.error("FAIL Helius getTransactionsForAddress preference missing"); failed = true; }
if (service.indexOf("helius-rpc-history") > service.indexOf("helius-enhanced-compat")) { console.error("FAIL deprecated Helius enhanced path appears before preferred RPC history path"); failed = true; }
if (!service.includes("getSignaturesForAddress")) { console.error("FAIL canonical Solana RPC history fallback missing"); failed = true; }
if (!service.includes("POWERCHAIN_SUI_GRAPHQL_URL")) { console.error("FAIL Sui GraphQL history path missing"); failed = true; }
if (!helius.includes("getTransactionsForAddress")) { console.error("FAIL Helius RPC history method missing"); failed = true; }
if (!service.includes("fallbackReason")) { console.error("FAIL wallet fallback observability missing"); failed = true; }

if (failed) process.exit(1);
console.log("POWERCHAIN_WALLET_CHAIN_PRODUCTION_CHECK_PASS version=1.0.0");
