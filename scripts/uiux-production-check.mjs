import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const required = [
  "apps/bridge/app/fees/page.tsx",
  "apps/bridge/app/fees/loading.tsx",
  "apps/bridge/app/fees/error.tsx",
  "apps/bridge/components/bridge/service-fee-estimator.tsx",
  "apps/bridge/components/bridge/fee-transparency-card.tsx",
  "apps/bridge/components/bridge/bridge-progress.tsx",
  "apps/bridge/components/bridge/copy-address.tsx",
  "apps/bridge/components/bridge/mobile-action-bar.tsx",
  "apps/bridge/components/bridge/wallet-network-state.tsx",
  "apps/bridge/components/bridge/bridge-transaction-summary.tsx",
  "apps/bridge/components/bridge/live-transfer-card.tsx",
  "apps/bridge/components/bridge/bridge-action-button.tsx",
  "apps/bridge/components/ui/inline-alert.tsx",
  "apps/bridge/components/ui/skeleton.tsx",
  "apps/bridge/components/ui/empty-state.tsx",
  "apps/bridge/components/ui/page-header.tsx",
  "apps/bridge/hooks/use-media-query.ts",
  "apps/bridge/hooks/use-transfer-status.ts",
];
const errors = [];
const fail = (message) => { console.error(`POWERCHAIN_UIUX_PRODUCTION_CHECK_FAILED\n- ${message}`); process.exit(1); };
const mustExist = (rel) => { if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`); };
const mustContain = (rel, needle) => { const text = read(rel); if (!text.includes(needle)) fail(`${rel} missing ${needle}`); };
for (const file of required) if (!fs.existsSync(path.join(root, file))) errors.push(`Missing ${file}`);
if (errors.length === 0) {
  const fee = read("apps/bridge/components/bridge/service-fee-estimator.tsx");
  const page = read("apps/bridge/app/fees/page.tsx");
  const copy = read("apps/bridge/components/bridge/copy-address.tsx");
  const progress = read("apps/bridge/components/bridge/bridge-progress.tsx");
  const live = read("apps/bridge/components/bridge/live-transfer-card.tsx");
  const transferHook = read("apps/bridge/hooks/use-transfer-status.ts");
  const wallet = read("apps/bridge/components/bridge/wallet-network-state.tsx");
  const summary = read("apps/bridge/components/bridge/bridge-transaction-summary.tsx");
  const mobile = read("apps/bridge/components/bridge/mobile-action-bar.tsx");
  if (!fee.includes("/api/v1/fees/collection-plan")) errors.push("Estimator is not wired to collection-plan API");
  if (!fee.includes("principalRule") || !page.includes("1:1")) errors.push("1:1 principal UX invariant missing");
  if (!fee.includes("tabular-nums") || !summary.includes("tabular-nums")) errors.push("Exact amount presentation missing tabular numerals");
  if (!copy.includes("navigator.clipboard") || !copy.includes("aria-label")) errors.push("Accessible copy-address interaction missing");
  if (!progress.includes('aria-label="Bridge progress"')) errors.push("Accessible bridge-progress semantics missing");
  if (!transferHook.includes("EventSource") || !(transferHook.includes("5_000") || transferHook.includes("5000"))) errors.push("SSE with polling fallback missing");
  if (!live.includes("Live") || !live.includes("Polling")) errors.push("Transfer connection-state UX missing");
  if (!wallet.includes("Wrong network") || !wallet.includes("Connect wallet")) errors.push("Wallet/network recovery states missing");
  if (!summary.includes("Service fee") || !summary.includes("Source token debit")) errors.push("Transfer review fee breakdown missing");
  if (!mobile.includes("env(safe-area-inset-bottom)")) errors.push("Mobile safe-area action bar missing");
  for (const text of [fee, summary, live]) if (text.includes("toLocaleString(")) errors.push("Locale-dependent asset formatting is forbidden");
  for (const file of required) {
    const text = read(file);
    if (text.includes("OPERATOR_API_TOKEN") || text.includes("POWERCHAIN_GOVERNANCE_API_TOKEN")) errors.push(`Operator/governance secret leaked into UI: ${file}`);
  }
}
if (errors.length) {
  console.error("POWERCHAIN_UIUX_PRODUCTION_CHECK_FAILED");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, version: "1.0.0", checks: ["fee transparency", "wallet/network states", "transfer review", "SSE polling fallback", "bridge progress", "mobile safe-area CTA", "loading/error/empty states", "deterministic amounts", "accessible controls", "no client operator secrets"] }, null, 2));

const advancedFiles = [
  "apps/bridge/components/bridge/amount-input-card.tsx",
  "apps/bridge/components/bridge/route-selector.tsx",
  "apps/bridge/components/bridge/transaction-confirmation-dialog.tsx",
  "apps/bridge/components/bridge/history-toolbar.tsx",
  "apps/bridge/components/bridge/status-recovery-actions.tsx",
  "apps/bridge/components/ui/mobile-section-tabs.tsx",
];
for (const file of advancedFiles) {
  if (!fs.existsSync(path.join(root, file))) fail(`missing advanced UI component ${file}`);
}
const amountInput = read("apps/bridge/components/bridge/amount-input-card.tsx");
if (!amountInput.includes("balanceBaseUnits") || !amountInput.includes("MAX") || !amountInput.includes("aria-invalid")) fail("amount input must expose balance/max/accessibility states");
const routeSelector = read("apps/bridge/components/bridge/route-selector.tsx");
if (!routeSelector.includes("Reverse bridge direction") || !routeSelector.includes("Wormhole NTT")) fail("route selector must expose explicit route reversal and protocol context");
const confirmation = read("apps/bridge/components/bridge/transaction-confirmation-dialog.tsx");
if (!confirmation.includes("Confirm & sign") || !confirmation.includes("cannot reverse")) fail("confirmation dialog must make signing/finality explicit");
const history = read("apps/bridge/components/bridge/history-toolbar.tsx");
if (!history.includes("Search transfer ID or wallet") || !history.includes("All statuses")) fail("history toolbar must support search and status filtering");
const recovery = read("apps/bridge/components/bridge/status-recovery-actions.tsx");
if (!recovery.includes("Check status now") || !recovery.includes("transferNeedsAttention")) fail("status recovery actions must cover refresh and reconciliation attention");

for (const rel of [
  "apps/bridge/hooks/use-quote-expiry.ts",
  "apps/bridge/hooks/use-resumable-transfer.ts",
  "apps/bridge/hooks/use-history-filters.ts",
  "apps/bridge/components/bridge/quote-expiry-banner.tsx",
  "apps/bridge/components/bridge/bridge-preflight-card.tsx",
  "apps/bridge/components/bridge/transaction-result-alert.tsx",
  "apps/bridge/components/bridge/resume-transfer-card.tsx",
]) mustExist(rel);
mustContain("apps/bridge/hooks/use-resumable-transfer.ts", "powerchain.bridge.active-transfer.v1");
mustContain("apps/bridge/hooks/use-history-filters.ts", "sessionStorage");
mustContain("apps/bridge/components/bridge/quote-expiry-banner.tsx", "Quote expired");
mustContain("apps/bridge/components/bridge/bridge-preflight-card.tsx", "Correct source network");
mustContain("apps/bridge/components/bridge/transaction-result-alert.tsx", "Do not repeatedly sign an unknown transaction");
mustContain("apps/bridge/components/bridge/resume-transfer-card.tsx", "Resume transfer");
console.log("POWERCHAIN_UIUX_ADVANCED_FLOW_CHECK_PASS");

for (const rel of [
  "apps/bridge/hooks/use-service-fee-plan.ts",
  "apps/bridge/components/bridge/inline-fee-estimate.tsx",
  "apps/bridge/components/bridge/route-health-banner.tsx",
  "apps/bridge/components/bridge/active-transfer-banner.tsx",
  "apps/bridge/components/bridge/compact-transfer-summary.tsx",
]) mustExist(rel);
mustContain("apps/bridge/hooks/use-service-fee-plan.ts", "AbortController");
mustContain("apps/bridge/hooks/use-service-fee-plan.ts", "debounceMs");
mustContain("apps/bridge/hooks/use-service-fee-plan.ts", "/api/v1/fees/collection-plan");
mustContain("apps/bridge/components/bridge/route-health-banner.tsx", "Route incident");
mustContain("apps/bridge/components/bridge/active-transfer-banner.tsx", "Transfer in progress");
mustContain("apps/bridge/hooks/use-transfer-status.ts", "visibilitychange");
mustContain("apps/bridge/hooks/use-transfer-status.ts", "15_000");
mustContain("apps/bridge/components/bridge/live-transfer-card.tsx", "Status update delayed");
mustContain("apps/bridge/components/bridge/amount-input-card.tsx", "25%");
console.log("POWERCHAIN_UIUX_PRODUCTION_POLISH_CHECK_PASS");

for (const rel of [
  "apps/bridge/hooks/use-network-online.ts",
  "apps/bridge/hooks/use-bridge-draft.ts",
  "apps/bridge/components/bridge/transfer-activity-list.tsx",
  "apps/bridge/components/bridge/mobile-history-card.tsx",
  "apps/bridge/components/ui/screen-reader-status.tsx",
]) mustExist(rel);
mustContain("apps/bridge/hooks/use-network-online.ts", 'window.addEventListener("offline"');
mustContain("apps/bridge/hooks/use-transfer-status.ts", "setConnection");
mustContain("apps/bridge/hooks/use-transfer-status.ts", '"offline"');
mustContain("apps/bridge/hooks/use-transfer-status.ts", 'setInterval');
mustContain("apps/bridge/hooks/use-transfer-status.ts", '30_000');
mustContain("apps/bridge/hooks/use-transfer-status.ts", 'window.addEventListener("online"');
mustContain("apps/bridge/components/bridge/live-transfer-card.tsx", "You are offline");
mustContain("apps/bridge/components/bridge/live-transfer-card.tsx", "TransferActivityList");
mustContain("apps/bridge/hooks/use-bridge-draft.ts", "powerchain.bridge.form-draft.v1");
mustContain("apps/bridge/hooks/use-bridge-draft.ts", "MAX_AGE_MS");
mustContain("apps/bridge/components/bridge/mobile-history-card.tsx", "tabular-nums");
mustContain("apps/bridge/components/bridge/bridge-preflight-card.tsx", "Internet connection");
mustContain("apps/bridge/components/bridge/bridge-action-button.tsx", "Reconnect to continue");
const activeTransfer = read("apps/bridge/components/bridge/active-transfer-banner.tsx");
if (activeTransfer.includes("backdrop-blur") || activeTransfer.includes("supports-[backdrop-filter]")) fail("active transfer banner must not use glassmorphism/backdrop blur");
console.log("POWERCHAIN_UIUX_RELIABILITY_ACCESSIBILITY_CHECK_PASS");

for (const rel of [
  "apps/bridge/components/bridge/transfer-status-chip.tsx",
  "apps/bridge/components/bridge/transfer-details-panel.tsx",
  "apps/bridge/components/bridge/route-maintenance-notice.tsx",
  "apps/bridge/components/ui/loading-states.tsx",
  "apps/bridge/hooks/use-reduced-motion.ts",
]) mustExist(rel);
mustContain("apps/bridge/components/bridge/transaction-confirmation-dialog.tsx", "returnFocusRef");
mustContain("apps/bridge/components/bridge/transaction-confirmation-dialog.tsx", "aria-labelledby");
mustContain("apps/bridge/components/bridge/transaction-confirmation-dialog.tsx", "ScreenReaderStatus");
mustContain("apps/bridge/components/bridge/live-transfer-card.tsx", "TransferStatusChip");
mustContain("apps/bridge/components/bridge/live-transfer-card.tsx", "ScreenReaderStatus");
mustContain("apps/bridge/components/bridge/transfer-details-panel.tsx", "Destination finality");
mustContain("apps/bridge/components/bridge/transfer-details-panel.tsx", "tabular-nums");
mustContain("apps/bridge/components/bridge/route-maintenance-notice.tsx", "Scheduled maintenance");
mustContain("apps/bridge/components/ui/loading-states.tsx", "TransferStatusSkeleton");
mustContain("apps/bridge/components/ui/loading-states.tsx", "HistoryListSkeleton");
mustContain("apps/bridge/hooks/use-reduced-motion.ts", "prefers-reduced-motion");
console.log("POWERCHAIN_UIUX_INTERACTION_QUALITY_CHECK_PASS");

for (const rel of [
  "apps/bridge/hooks/use-history-query-state.ts",
  "apps/bridge/components/bridge/history-pagination.tsx",
  "apps/bridge/components/bridge/transfer-deep-link.tsx",
]) mustExist(rel);
mustContain("apps/bridge/hooks/use-history-query-state.ts", "useSearchParams");
mustContain("apps/bridge/hooks/use-history-query-state.ts", "router[mode]");
mustContain("apps/bridge/components/bridge/history-pagination.tsx", "Transfer history pages");
mustContain("apps/bridge/components/bridge/history-pagination.tsx", "Transfers per page");
mustContain("apps/bridge/components/bridge/transfer-deep-link.tsx", "Copy transfer status link");
mustContain("apps/bridge/hooks/use-service-fee-plan.ts", "timeoutMs");
mustContain("apps/bridge/hooks/use-service-fee-plan.ts", "Fee estimate timed out");
mustContain("apps/bridge/components/ui/mobile-section-tabs.tsx", "ArrowLeft");
mustContain("apps/bridge/components/ui/mobile-section-tabs.tsx", "ArrowRight");
mustContain("apps/bridge/components/ui/mobile-section-tabs.tsx", "motion-reduce:transition-none");
mustContain("apps/bridge/components/bridge/route-health-banner.tsx", "View network status");
console.log("POWERCHAIN_UIUX_NAVIGATION_STATE_CHECK_PASS");

for (const rel of [
  "apps/bridge/lib/bridge/transfer-status.ts",
  "apps/bridge/hooks/use-transfer-status.ts",
  "apps/bridge/components/bridge/copy-address.tsx",
  "apps/bridge/components/bridge/transfer-deep-link.tsx",
]) mustExist(rel);
mustContain("apps/bridge/lib/bridge/transfer-status.ts", "TERMINAL_TRANSFER_STATUSES");
mustContain("apps/bridge/lib/bridge/transfer-status.ts", "normalizeTransferStatus");
mustContain("apps/bridge/hooks/use-transfer-status.ts", "cursor.current = null");
mustContain("apps/bridge/hooks/use-transfer-status.ts", "responseTransferId !== expectedTransferId");
mustContain("apps/bridge/hooks/use-transfer-status.ts", "MAX_EVENTS = 200");
mustContain("apps/bridge/hooks/use-transfer-status.ts", "POLL_TIMEOUT_MS = 10_000");
mustContain("apps/bridge/hooks/use-transfer-status.ts", "events/stream${qs}");
mustContain("apps/bridge/components/bridge/live-transfer-card.tsx", "isTerminalTransferStatus");
mustContain("apps/bridge/components/bridge/transfer-status-chip.tsx", "transferNeedsAttention");
mustContain("apps/bridge/components/bridge/copy-address.tsx", "Clipboard unavailable");
mustContain("apps/bridge/components/bridge/transfer-deep-link.tsx", "Copy failed");
mustContain("apps/bridge/components/ui/mobile-section-tabs.tsx", "scrollIntoView");
console.log("POWERCHAIN_UIUX_COHERENCE_HARDENING_CHECK_PASS");
mustContain("apps/bridge/hooks/use-transfer-status.ts", "events: [record]");
console.log("POWERCHAIN_UIUX_SSE_EVENT_NORMALIZATION_CHECK_PASS");


const providerStripPath = path.join(root, "apps/bridge/components/bridge/provider-status-strip.tsx");
if (!fs.existsSync(providerStripPath)) fail("provider status strip missing");
const providerStrip = fs.readFileSync(providerStripPath, "utf8");
if (!providerStrip.includes("Status is stale") || !providerStrip.includes("Networks operational")) fail("provider health UX states missing");
const freshnessPath = path.join(root, "apps/bridge/components/ui/data-freshness-badge.tsx");
if (!fs.existsSync(freshnessPath)) fail("data freshness badge missing");


// Fully-wired runtime UI: one bridge gate composes readiness + integrity and preflight can consume it.
{
  const gate = read("apps/bridge/components/bridge/bridge-runtime-gate.tsx");
  const preflight = read("apps/bridge/components/bridge/bridge-preflight-card.tsx");
  if (!gate.includes("useBridgeRuntime")) fail("bridge runtime gate must consume the unified runtime hook");
  if (!gate.includes("Bridge temporarily unavailable")) fail("runtime gate needs a blocking UX state");
  if (!gate.includes("reduced redundancy")) fail("runtime gate needs degraded redundancy UX");
  if (!gate.includes("persisted reconciliation evidence remains authoritative")) fail("runtime gate must disclose accounting boundary");
  if (!preflight.includes("runtimeReady")) fail("bridge preflight must support runtime readiness");
}

console.log("POWERCHAIN_UIUX_FULLY_WIRED_CHECK_PASS version=1.0.0");

// Runtime freshness must be visible to the UX; expired runtime data cannot enable new signing.
{
  const gate = read("apps/bridge/components/bridge/bridge-runtime-gate.tsx");
  const hook = read("apps/bridge/hooks/use-bridge-runtime.ts");
  if (!gate.includes("Runtime decision expired")) fail("runtime expiry UX missing");
  if (!hook.includes("canOpenWalletSignature") || !hook.includes("!stale")) fail("wallet signing must respect runtime freshness");
}
console.log("POWERCHAIN_UIUX_RUNTIME_EXECUTION_CHECK_PASS version=1.0.0");
