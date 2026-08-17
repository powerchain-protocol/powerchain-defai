import fs from "node:fs";

const checks = [
  ["provider readiness initializes React 19 state", "apps/bridge/hooks/use-provider-readiness.ts", (s) => s.includes("useState<ProviderReadinessPayload | undefined>(undefined)") && s.includes("useState<string | undefined>(undefined)")],
  ["provider health initializes React 19 state", "apps/bridge/hooks/use-provider-health.ts", (s) => s.includes("useState<ProviderHealthPayload | undefined>(undefined)") && s.includes("useState<number | undefined>(undefined)")],
  ["no parameterless provider generic state", "apps/bridge/hooks/use-provider-health.ts", (s) => !/useState<[^>]+>\(\)/.test(s)],
  ["operation clear message omits undefined optionals", "apps/bridge/hooks/use-operation-journal.ts", (s) => s.includes("function clearMessage") && s.includes('{type:"clear"}') && !s.includes("id:current?.id")],
  ["operation parser omits absent optionals", "apps/bridge/lib/bridge/operation-journal.ts", (s) => s.includes("serverRevision === undefined ? {} : { serverRevision }") && s.includes("snapshotId === undefined ? {} : { snapshotId }")],
  ["provider refresh constants centralized", "apps/bridge/constants/provider-runtime.ts", (s) => s.includes("PROVIDER_REQUEST_TIMEOUT_MS") && s.includes("clampRefreshMs")],
  ["readiness is offline and stale aware", "apps/bridge/hooks/use-provider-readiness.ts", (s) => s.includes("navigator.onLine") && s.includes("const stale =") && s.includes("requestGeneration")],
  ["public websocket timing config bounded", "apps/bridge/lib/realtime/transport-policy.ts", (s) => s.includes("publicRealtimeSocketOptions") && s.includes("NEXT_PUBLIC_POWERCHAIN_WS_RECONNECT_INTERVAL") && s.includes("NEXT_PUBLIC_POWERCHAIN_WS_HEARTBEAT_INTERVAL")],
  ["transfer status consumes websocket timing policy", "apps/bridge/hooks/use-transfer-status.ts", (s) => s.includes("publicRealtimeSocketOptions()")],
  ["backend endpoint fallbacks deduplicated", "apps/backend/src/config/endpoints.ts", (s) => s.includes("function uniqueUrls") && s.includes("url === primary")],
  ["global wallet provider avoids server evaluation of Mysten dApp Kit", "apps/bridge/components/wallet/wallet-provider.tsx", (s) => !s.includes("@mysten/dapp-kit-react") && s.includes("@walletconnect/solana-adapter")],
  ["shared connected-wallet hook uses SSR-safe Sui snapshot", "apps/bridge/lib/wallet/connected-wallets.ts", (s) => s.includes("useSuiWalletSnapshot") && !s.includes("@mysten/dapp-kit-react")],
  ["Sui wallet runtime is a browser-only dynamic island", "apps/bridge/context/sui-wallet-context.tsx", (s) => s.includes("sui-wallet-runtime") && s.includes("ssr: false")],
  ["Sui connect UI is dynamically SSR-disabled", "apps/bridge/components/wallet/header-wallet-controls.tsx", (s) => s.includes("sui-connect-button") && s.includes("ssr: false")],
  ["Sui swap avoids a stale Turbopack async chunk boundary", "apps/bridge/components/trade/multichain-swap-interface.tsx", (s) => s.includes('"use client"') && s.includes('import { SuiSwapIsland } from "./sui-swap-island"') && !s.includes("next/dynamic") && !s.includes("ssr: false")],
  ["Sui swap island remains a Client Component boundary", "apps/bridge/components/trade/sui-swap-island.tsx", (s) => s.includes('"use client"') && s.includes("DAppKitProvider")],
  ["staking remains deployment gated", "apps/staking/README.md", (s) => s.includes("fail-closed") && s.includes("must not fabricate APR") && s.includes("connected wallet remains the signing authority")],
];
let failed = false;
for (const [label, file, predicate] of checks) {
  const source = fs.readFileSync(file, "utf8");
  const ok = predicate(source);
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  failed ||= !ok;
}
if (failed) process.exit(1);
console.log("Hooks/runtime production check PASS");
