import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routes = [
  "apps/bridge/app/page.tsx",
  "apps/bridge/app/chat/page.tsx",
  "apps/bridge/app/swap/page.tsx",
  "apps/bridge/app/bridge/page.tsx",
  "apps/bridge/app/staking/page.tsx",
  "apps/bridge/app/wallet/page.tsx",
  "apps/bridge/app/assets/page.tsx",
  "apps/bridge/app/claim/page.tsx",
  "apps/bridge/app/history/page.tsx",
  "apps/bridge/app/fees/page.tsx",
  "apps/bridge/app/explorer/page.tsx",
  "apps/bridge/app/protocol/page.tsx",
  "apps/bridge/app/integrations/page.tsx",
  "apps/bridge/app/status/page.tsx",
  "apps/bridge/app/profile/page.tsx",
  "apps/bridge/app/settings/page.tsx",
];

for (const relative of routes) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) throw new Error(`Missing primary route: ${relative}`);
  const source = fs.readFileSync(file, "utf8");
  if (!source.includes("export const metadata")) throw new Error(`Missing metadata export: ${relative}`);
  if (!/title\s*:/.test(source)) throw new Error(`Missing route title: ${relative}`);
  if (!/description\s*:/.test(source)) throw new Error(`Missing route description: ${relative}`);
}

console.log(`POWERCHAIN_ROUTE_METADATA_CHECK_PASS routes=${routes.length}`);
