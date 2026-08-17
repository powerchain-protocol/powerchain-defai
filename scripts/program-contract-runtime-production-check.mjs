import fs from "node:fs";

const required = [
  "packages/protocol/src/programs.ts",
  "apps/bridge/server/services/program-readiness.ts",
  "apps/bridge/app/api/v1/programs/readiness/route.ts",
  "apps/bridge/app/api/v1/programs/readiness/[programId]/route.ts",
  "apps/bridge/components/protocol/protocol-dashboard.tsx",
  "apps/bridge/app/protocol/page.tsx",
  "docs/PROGRAMS_AND_CONTRACTS.md",
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`missing ${file}`);
const solana = fs.readFileSync("programs/solana/powerchain_bridge/src/lib.rs", "utf8");
const sui = fs.readFileSync("contracts/sui/powerchain_bridge/sources/powerchain_bridge.move", "utf8");
const routes = fs.readFileSync("apps/bridge/config/app-routes.ts", "utf8");
const nav = fs.readFileSync("apps/bridge/components/navigation/navigation-config.ts", "utf8");

const registry = fs.readFileSync("packages/protocol/src/programs.ts", "utf8");
const readiness = fs.readFileSync("apps/bridge/server/services/program-readiness.ts", "utf8");
if (!registry.includes("requiredForCoreBridge: true") || !registry.includes("configVersion: 1")) throw new Error("Core bridge program requirements/config version are not explicit");
if (!readiness.includes("required.every((item) => item.verified && item.executable)")) throw new Error("Protocol readiness can become green without verified core bridge programs");
if (!readiness.includes("SUI_BRIDGE_CONFIG_TYPE_MISMATCH") || !readiness.includes("SUI_INFORMATION_COMMITMENT_TYPE_MISMATCH")) throw new Error("Sui bridge object types are not runtime-verified");
if (!readiness.includes("getProgramRuntimeItem") || !readiness.includes("verificationDurationMs") || !readiness.includes("runtime-verifier")) throw new Error("Program verifiers are not isolated with per-program evidence metadata");
const itemRoute = fs.readFileSync("apps/bridge/app/api/v1/programs/readiness/[programId]/route.ts", "utf8");
if (!itemRoute.includes("isProgramRuntimeId") || !itemRoute.includes("PROGRAM_ID_INVALID")) throw new Error("Per-program readiness route is not strictly allowlisted");
if (!solana.includes("assert_config_version(config)?") || !solana.includes("ConfigVersionMismatch")) throw new Error("Solana bridge config version is not enforced");
if (!sui.includes("assert_config_version(config)") || !sui.includes("E_CONFIG_VERSION_MISMATCH")) throw new Error("Sui bridge config version is not enforced");
if (!routes.includes('protocol: "/protocol"') || !routes.includes('source: "/contracts"') || !routes.includes('source: "/programs"')) throw new Error("Protocol routing is incomplete");
if (!nav.includes('label: "Protocol"')) throw new Error("Protocol navigation is missing");
console.log("POWERCHAIN_PROGRAM_CONTRACT_RUNTIME_PASS");
