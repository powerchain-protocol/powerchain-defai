import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];
function read(file) { return fs.readFileSync(path.join(root, file), "utf8"); }
function has(file, tokens) { const text = read(file); for (const token of tokens) if (!text.includes(token)) throw new Error(`${file}: missing ${token}`); checks.push(file); }

has("apps/bridge/lib/wallet/cursor.ts", ["unsupported wallet activity cursor version", "MAX_CURSOR_LENGTH", "base64url"]);
has("apps/bridge/server/services/wallet-portfolio.ts", ["principalEquivalentBaseUnits", "authoritativeForBridgeAccounting: false", "POWERCHAIN_WALLET_ACTIVITY_MAX_AGE_MS"]);
has("apps/bridge/server/services/wallet-activity-feed.ts", ["decodeWalletActivityCursor", "encodeWalletActivityCursor", "opaque: true"]);
has("apps/bridge/server/services/pwrc-transfers.ts", ["getTransfersByAddress", "POWERCHAIN_PWRC_SOLANA_MINT", "commitment: \"finalized\""]);
has("apps/bridge/app/api/v1/wallet/portfolio/route.ts", ["Cache-Control", "no-store"]);
has("apps/bridge/app/api/v1/wallet/activity/route.ts", ["INVALID_CURSOR", "getWalletActivityFeed"]);
has("apps/bridge/app/api/v1/wallet/solana/pwrc-transfers/route.ts", ["getPwrcTransfers", "no-store"]);
has("apps/bridge/hooks/use-wallet-activity-feed.ts", ["AbortController", "10_000", "loadMore"]);
has("apps/bridge/components/wallet/wallet-portfolio-card.tsx", ["1 PWRC ↔ 1 wPWRC principal", "Accounting authority: reconciliation"]);
const browserFiles = ["apps/bridge/hooks/use-wallet-activity-feed.ts", "apps/bridge/hooks/use-pwrc-transfers.ts", "apps/bridge/components/wallet/wallet-portfolio-card.tsx"].map(read).join("\n");
for (const secret of ["HELIUS_API_KEY", "POWERCHAIN_SOLANA_RPC_URL", "POWERCHAIN_SUI_RPC_URL"]) if (browserFiles.includes(secret)) throw new Error(`browser secret reference forbidden: ${secret}`);
console.log(`wallet portfolio production check PASS (${checks.length} files)`);
