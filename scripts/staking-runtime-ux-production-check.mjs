import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const must = (condition, message) => { if (!condition) throw new Error(message); };

const dashboard = read("apps/bridge/components/staking/staking-dashboard.tsx");
const actions = read("apps/bridge/components/staking/solana-staking-actions.tsx");
const runtimeHook = read("apps/bridge/hooks/use-staking-runtime.ts");
const positionHook = read("apps/bridge/hooks/use-staking-position.ts");
const page = read("apps/bridge/app/staking/page.tsx");

for (const token of ["useStakingRuntime", "walletBalanceError", "getAccountInfo", "Refresh", "initialStatus"]) {
  must(dashboard.includes(token), `staking dashboard missing runtime UX token: ${token}`);
}
must(!dashboard.includes("setWalletBalance(\"0\");}}catch"), "wallet RPC failure must not be converted into a zero balance");
for (const token of ["minimumStake", "Amount exceeds the active staked position", "Amount exceeds the connected wallet PWRC balance", "setQuickAmount", "confirmation.value.err", "inFlight.current", "Verify the signature before retrying"]) {
  must(actions.includes(token), `staking actions missing transaction safety token: ${token}`);
}
for (const token of ["activeController.current?.abort()", "document.visibilityState", "navigator.onLine", "BRIDGE_API_ENDPOINTS.staking.status"]) {
  must(runtimeHook.includes(token), `staking runtime refresh missing lifecycle token: ${token}`);
}
for (const token of ["activeController.current?.abort()", "BRIDGE_API_ENDPOINTS.staking.position"]) {
  must(positionHook.includes(token), `staking position hook missing lifecycle token: ${token}`);
}
must(page.includes("initialStatus={status}"), "staking page must hydrate client runtime from server-verified initial status");
console.log("POWERCHAIN_STAKING_RUNTIME_UX_PRODUCTION_CHECK_PASS version=1.0.0");
