import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const requireText = (path, text, message) => {
  if (!read(path).includes(text)) throw new Error(`${message}: ${path}`);
};
const forbidText = (path, text, message) => {
  if (read(path).includes(text)) throw new Error(`${message}: ${path}`);
};

const portfolio = "apps/bridge/hooks/use-portfolio.ts";
requireText(portfolio, "const dataRef = useRef<PortfolioData | null>(null);", "Portfolio must use a snapshot ref instead of coupling refresh identity to fetched data");
requireText(portfolio, "safeClientErrorCode", "Portfolio errors must be normalized");
requireText(portfolio, 'setError("PORTFOLIO_OFFLINE")', "Portfolio must fail closed while offline");
forbidText(portfolio, "[solanaAddress,suiAddress,online,data]", "Portfolio refresh callback must not depend on fetched data");
forbidText(portfolio, "[solanaAddress, suiAddress, online, data]", "Portfolio refresh callback must not depend on fetched data");

for (const path of ["apps/bridge/hooks/use-pools.ts", "apps/bridge/hooks/use-liquidity.ts"]) {
  requireText(path, "safeClientErrorCode", "Operational data hook errors must be normalized");
  requireText(path, 'window.addEventListener("offline", update)', "Operational data hooks must observe offline transitions");
  requireText(path, "ref.current?.abort()", "Operational data hooks must abort stale requests");
}

const integrity = "apps/bridge/hooks/use-pwrc-integrity.ts";
requireText(integrity, 'setError("INTEGRITY_OFFLINE")', "Integrity checks must pause while offline");
requireText(integrity, "const stale = Boolean", "Integrity evidence must expose freshness state");
requireText(integrity, "controller.current?.abort()", "Integrity checks must abort stale requests");

const recent = "apps/bridge/components/bridge/recent-transfers-card.tsx";
requireText(recent, "bridgeStatusRoute(row.id)", "Recent transfers must use canonical status-route construction");
forbidText(recent, "encodeURIComponent(row.id)", "Recent transfers must not manually build transfer status routes");

for (const path of ["apps/bridge/components/trade/solana-swap-interface.tsx", "apps/bridge/components/trade/swap-interface.tsx"]) {
  forbidText(path, 'return raw ||', "Swap surfaces must not reflect arbitrary runtime errors");
  forbidText(path, 'return text||', "Swap surfaces must not reflect arbitrary runtime errors");
}

const selector = "apps/bridge/components/bridge/route-selector.tsx";
const selectorSource = read(selector);
const swapBindings = selectorSource.match(/<NetworkButton[^>]+onClick=\{swap\}/g)?.length ?? 0;
if (swapBindings < 2) throw new Error("Both bridge route cards must reverse the two-network route consistently");

console.log("POWERCHAIN_OPERATIONAL_READ_HOOKS_CHECK_PASS");
