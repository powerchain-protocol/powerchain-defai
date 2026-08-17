import fs from "node:fs";

const bridge = fs.readFileSync("programs/solana/powerchain_bridge/src/lib.rs", "utf8");
const staking = fs.readFileSync("programs/solana/powerchain_staking/src/lib.rs", "utf8");
const escrow = fs.readFileSync("programs/solana/powerchain_escrow/src/lib.rs", "utf8");
const move = fs.readFileSync("contracts/sui/powerchain_bridge/Move.toml", "utf8");
const production = process.env.NODE_ENV === "production";
const bridgeProgramId = bridge.match(/declare_id!\("([1-9A-HJ-NP-Za-km-z]+)"\)/)?.[1] ?? "";
const stakingProgramId = staking.match(/declare_id!\("([1-9A-HJ-NP-Za-km-z]+)"\)/)?.[1] ?? "";
const escrowProgramId = escrow.match(/declare_id!\("([1-9A-HJ-NP-Za-km-z]+)"\)/)?.[1] ?? "";
const stakingPlaceholder = "Stake11111111111111111111111111111111111111";
const escrowPlaceholder = "8AQLAvN5gcV1nbWoEfaPqnorsqJLPjmvEFeZBHkWCKBw";

if (!bridgeProgramId) throw new Error("SOLANA_BRIDGE_PROGRAM_ID_MISSING");
if (!stakingProgramId) throw new Error("SOLANA_STAKING_PROGRAM_ID_MISSING");
if (!escrowProgramId) throw new Error("SOLANA_ESCROW_PROGRAM_ID_MISSING");
if (!/powerchain_bridge\s*=\s*"0x0"/.test(move)) throw new Error("SUI_SOURCE_ADDRESS_MUST_REMAIN_0X0");

if (production) {
  const sui = process.env.POWERCHAIN_SUI_BRIDGE_PACKAGE_ID?.trim()?.toLowerCase() ?? "";
  if (!/^0x[0-9a-f]{64}$/.test(sui)) throw new Error("PRODUCTION_SUI_BRIDGE_PACKAGE_ID_REQUIRED");
  const configuredStaking = process.env.POWERCHAIN_SOLANA_STAKING_PROGRAM_ID?.trim() ?? "";
  if (configuredStaking === stakingPlaceholder) throw new Error("PRODUCTION_STAKING_PLACEHOLDER_FORBIDDEN");
  const configuredEscrow = process.env.POWERCHAIN_SOLANA_ESCROW_PROGRAM_ID?.trim() ?? "";
  if (configuredEscrow === escrowPlaceholder) throw new Error("PRODUCTION_ESCROW_SOURCE_PLACEHOLDER_FORBIDDEN");
}

const stakingDeployment = stakingProgramId === stakingPlaceholder ? "source-placeholder" : "source-id-synchronized";
const escrowDeployment = escrowProgramId === escrowPlaceholder ? "source-placeholder" : "source-id-synchronized";
console.log(`program-placeholders: Sui bridge alias fail-closed; Solana bridge ${bridgeProgramId}; Solana staking ${stakingDeployment}; Solana escrow ${escrowDeployment}; production runtime ${production ? "checked" : "optional"}`);
