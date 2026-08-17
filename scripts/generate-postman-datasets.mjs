import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "api", "postman", "datasets");
const csvPath = path.join(outDir, "PowerChain-DeFAI.dataset.csv");
const check = process.argv.includes("--check");

const columns = [
  "scenario",
  "baseUrl",
  "swapUrl",
  "bridgeUrl",
  "apiKey",
  "id",
  "transferId",
  "suiWallet",
  "suiInputCoinType",
  "suiOutputCoinType",
  "solanaWallet",
  "solanaInputMint",
  "solanaOutputMint",
  "swapAmountBaseUnits",
  "slippageBps",
  "suiMinimumOutBaseUnits",
  "signedTransaction",
  "jupiterRequestId",
  "jupiterMinimumOutputBaseUnits",
  "bridgeDirection",
  "bridgePrincipalBaseUnits",
  "bridgeSourceAddress",
  "bridgeDestinationAddress",
  "bridgeQuoteId",
  "bridgeIntentCommitment",
  "bridgeRuntimeSnapshotId",
  "notes",
];

const blank = Object.fromEntries(columns.map((column) => [column, ""]));
const rows = [
  {
    ...blank,
    scenario: "local-readonly",
    baseUrl: "http://localhost:3000",
    swapUrl: "http://localhost:3000",
    bridgeUrl: "http://localhost:3000",
    id: "replace-me",
    transferId: "replace-me",
    swapAmountBaseUnits: "1000000000",
    slippageBps: "50",
    bridgeDirection: "SUI_TO_SOLANA",
    bridgePrincipalBaseUnits: "1000000000",
    notes: "Safe local template. API keys and signing material intentionally blank.",
  },
  {
    ...blank,
    scenario: "production-readonly",
    baseUrl: "https://powerchain.app",
    swapUrl: "https://swap.powerchain.app",
    bridgeUrl: "https://bridge.powerchain.app",
    id: "replace-me",
    transferId: "replace-me",
    notes: "Production host template for GET/read-only verification. Add credentials through an environment or Postman Vault, not this dataset.",
  },
  {
    ...blank,
    scenario: "sui-swap-template",
    baseUrl: "https://powerchain.app",
    swapUrl: "https://swap.powerchain.app",
    bridgeUrl: "https://bridge.powerchain.app",
    suiWallet: "replace-with-connected-sui-address",
    suiInputCoinType: "0x2::sui::SUI",
    suiOutputCoinType: "replace-with-approved-sui-coin-type",
    swapAmountBaseUnits: "1000000000",
    slippageBps: "50",
    suiMinimumOutBaseUnits: "replace-after-quote",
    notes: "Template only. Review quote freshness and minimum output; wallet signing remains external to Postman.",
  },
  {
    ...blank,
    scenario: "solana-swap-template",
    baseUrl: "https://powerchain.app",
    swapUrl: "https://swap.powerchain.app",
    bridgeUrl: "https://bridge.powerchain.app",
    solanaWallet: "replace-with-connected-solana-address",
    solanaInputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    solanaOutputMint: "PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc",
    swapAmountBaseUnits: "1000000",
    slippageBps: "50",
    signedTransaction: "replace-after-wallet-signature",
    jupiterRequestId: "replace-after-order",
    jupiterMinimumOutputBaseUnits: "replace-after-order",
    notes: "Template only. Never store a Jupiter or wallet secret here; signedTransaction is populated only after explicit wallet approval.",
  },
  {
    ...blank,
    scenario: "bridge-template",
    baseUrl: "https://powerchain.app",
    swapUrl: "https://swap.powerchain.app",
    bridgeUrl: "https://bridge.powerchain.app",
    transferId: "replace-after-create",
    bridgeDirection: "SUI_TO_SOLANA",
    bridgePrincipalBaseUnits: "1000000000",
    bridgeSourceAddress: "replace-with-source-wallet",
    bridgeDestinationAddress: "replace-with-destination-wallet",
    bridgeQuoteId: "replace-after-quote",
    bridgeIntentCommitment: "replace-after-quote",
    bridgeRuntimeSnapshotId: "replace-after-quote",
    notes: "Template only. Wormhole NTT remains principal-movement authority; Postman never proves settlement or finality.",
  },
];

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const csv = `${columns.join(",")}\n${rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")).join("\n")}\n`;
const files = [[csvPath, csv]];

if (check) {
  let ok = true;
  for (const [file, expected] of files) {
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== expected) {
      console.error(`Stale Postman dataset artifact: ${path.relative(root, file)}`);
      ok = false;
    }
  }
  if (!ok) process.exit(1);
  console.log(`Postman CSV dataset current (${rows.length} rows / ${columns.length} columns)`);
} else {
  fs.mkdirSync(outDir, { recursive: true });
  for (const [file, value] of files) fs.writeFileSync(file, value);
  console.log(`Generated Postman CSV dataset (${rows.length} rows / ${columns.length} columns)`);
}
