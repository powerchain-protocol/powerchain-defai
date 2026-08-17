import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const mustContain = (file, token) => {
  const source = read(file);
  if (!source.includes(token)) throw new Error(`${file} missing ${token}`);
};
const mustNotContain = (file, token) => {
  const source = read(file);
  if (source.includes(token)) throw new Error(`${file} must not contain ${token}`);
};

for (const file of [
  "apps/bridge/app/api/v1/data/solana/route.ts",
  "apps/bridge/app/api/v1/data/sui/route.ts",
  "apps/bridge/app/api/v1/data/pwrc/integrity/route.ts",
  "apps/bridge/app/api/v1/wallet/portfolio/route.ts",
  "apps/bridge/app/api/v1/wallet/overview/route.ts",
  "apps/bridge/app/api/v1/wallet/activity/route.ts",
  "apps/bridge/app/api/v1/wallet/solana/route.ts",
  "apps/bridge/app/api/v1/wallet/sui/route.ts",
  "apps/bridge/app/api/v1/wallet/solana/pwrc-transfers/route.ts",
  "apps/bridge/app/api/v1/transactions/solana/[signature]/route.ts",
  "apps/bridge/app/api/v1/transactions/sui/[digest]/route.ts",
  "apps/bridge/app/api/v1/assets/bridge/route.ts",
  "apps/bridge/app/api/v1/bridge/config/route.ts",
  "apps/bridge/app/api/v1/bridge/routes/route.ts",
  "apps/bridge/app/api/v1/bridge/transfers/[id]/events/stream/route.ts",
]) {
  mustNotContain(file, "error instanceof Error ? error.message");
  mustNotContain(file, "String(error)");
}

mustContain("apps/bridge/server/http.ts", "safeErrorCode");
mustContain("apps/bridge/server/http.ts", 'headers.set("pragma"');
mustContain("apps/bridge/lib/actions/bridge-fetch.ts", "publicErrorCode");
mustContain("apps/bridge/lib/actions/bridge-fetch.ts", "error?: string | { code?: string; message?: string }");
mustContain("apps/bridge/lib/actions/bridge-fetch.ts", "Bridge service is temporarily unreachable");

for (const file of [
  "apps/bridge/components/bridge/active-transfer-banner.tsx",
  "apps/bridge/components/bridge/resume-transfer-card.tsx",
  "apps/bridge/components/bridge/transfer-deep-link.tsx",
  "apps/bridge/components/bridge/status-recovery-actions.tsx",
  "apps/bridge/components/bridge/wormhole-ntt-panel.tsx",
]) {
  mustContain(file, "bridgeStatusRoute");
  mustNotContain(file, "encodeURIComponent(active.transferId)");
  mustNotContain(file, '`/bridge/status/${');
}

mustNotContain("apps/bridge/components/settings/settings-dashboard.tsx", "error instanceof Error ? error.message");
mustContain("apps/bridge/app/api/v1/bridge/transfers/[id]/source/route.ts", "json(request, 16 * 1024)");
mustContain("apps/bridge/app/api/v1/bridge/transfers/[id]/events/route.ts", "Math.min(100, Math.max(1");

console.log("POWERCHAIN_PUBLIC_ERROR_CONTRACT_CHECK_PASS");
