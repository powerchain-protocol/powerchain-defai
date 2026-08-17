import fs from "node:fs";

const files = [
  "apps/bridge/server/services/program-readiness.ts",
  "apps/bridge/types/programs.ts",
  "apps/bridge/lib/data/program-runtime-validation.ts",
  "apps/bridge/components/protocol/protocol-dashboard.tsx",
  "contracts/sui/powerchain_bridge/sources/powerchain_bridge.move",
  "docs/PROGRAM_DEPLOYMENT_EVIDENCE.md",
];
for (const file of files) if (!fs.existsSync(file)) throw new Error(`missing ${file}`);

const service = fs.readFileSync(files[0], "utf8");
const types = fs.readFileSync(files[1], "utf8");
const validation = fs.readFileSync(files[2], "utf8");
const ui = fs.readFileSync(files[3], "utf8");
const sui = fs.readFileSync(files[4], "utf8");

for (const loader of [
  "BPFLoader1111111111111111111111111111111111",
  "BPFLoader2111111111111111111111111111111111",
  "BPFLoaderUpgradeab1e11111111111111111111111",
  "LoaderV411111111111111111111111111111111111",
]) if (!service.includes(loader)) throw new Error(`recognized Solana loader missing: ${loader}`);

for (const marker of [
  "SOLANA_BRIDGE_PROGRAM_LOADER_UNRECOGNIZED",
  "recognizedSolanaLoader(account?.owner)",
  "SUI_BRIDGE_CONFIG_NOT_SHARED",
  "SUI_INFORMATION_COMMITMENT_NOT_SHARED",
  "isSuiSharedOwner(config.value.data?.owner)",
  "isSuiSharedOwner(information.value.data?.owner)",
]) if (!service.includes(marker)) throw new Error(`program deployment-evidence marker missing: ${marker}`);

if (!types.includes('kind: "solana-loader"') || !types.includes('kind: "sui-shared-objects"')) throw new Error("typed deployment evidence missing");
if (!validation.includes("isDeploymentEvidence") || !validation.includes("loader-v4")) throw new Error("strict deployment-evidence validation missing");
if (!ui.includes("Deployment evidence") || !ui.includes("deploymentEvidenceLabel")) throw new Error("Protocol deployment-evidence UI missing");
if (!sui.includes("transfer::share_object(config)") || !sui.includes("transfer::share_object(information)")) throw new Error("Sui shared-object source invariant missing");

console.log("POWERCHAIN_PROGRAM_DEPLOYMENT_EVIDENCE_PASS");
