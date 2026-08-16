import fs from "node:fs";

const checks = [
  ["Bridge ScreenReaderStatus uses children", "apps/bridge/components/bridge/live-transfer-card.tsx", (s) => !s.includes("<ScreenReaderStatus message=") && s.includes("<ScreenReaderStatus>{")],
  ["Bridge confirmation ScreenReaderStatus uses children", "apps/bridge/components/bridge/transaction-confirmation-dialog.tsx", (s) => !s.includes("<ScreenReaderStatus message=") && s.includes("<ScreenReaderStatus>")],
  ["fee-plan optional args omit undefined", "apps/bridge/components/bridge/inline-fee-estimate.tsx", (s) => s.includes("routeId === undefined ? {} : { routeId }") && s.includes("principalBaseUnits === undefined ? {} : { principalBaseUnits }")],
  ["progress descriptions omit absent optional field", "apps/bridge/components/bridge/live-transfer-card.tsx", (s) => s.includes("description === null ? {} : { description }") && !s.includes("description:i===0")],
  ["base-unit parser defaults split whole", "apps/bridge/lib/bridge/base-units.ts", (s) => s.includes('const [whole = "0", fraction = ""]')],
  ["fee estimator defaults split whole", "apps/bridge/components/bridge/service-fee-estimator.tsx", (s) => s.includes('const [whole = "0", fraction = ""]')],
  ["swap parser defaults split whole", "apps/bridge/components/trade/swap-interface.tsx", (s) => s.includes('const [whole = "0", fraction = ""]')],
  ["rate parser defaults split whole", "apps/backend/src/services/rates.ts", (s) => s.includes('const [whole = "0", fraction = ""]')],
  ["React 19 refs have initial values", "apps/bridge/hooks/use-provider-health.ts", (s) => !s.includes("useRef<AbortController>()") && s.includes("useRef<AbortController | null>(null)")],
  ["Prisma postinstall is environment-safe", "package.json", (s) => s.includes('"postinstall": "node scripts/postinstall.mjs"')],
  ["postinstall skips without DATABASE_URL", "scripts/postinstall.mjs", (s) => s.includes("if (!databaseUrl)") && s.includes("skipping Prisma generation")],
];

let failed = false;
for (const [label, file, predicate] of checks) {
  const source = fs.readFileSync(file, "utf8");
  const ok = predicate(source);
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  failed ||= !ok;
}
if (failed) process.exit(1);
console.log("Exact optional/type boundaries production check PASS");
