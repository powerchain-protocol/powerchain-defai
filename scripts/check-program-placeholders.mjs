import fs from "node:fs";
const anchor = fs.readFileSync("programs/solana/powerchain_bridge/src/lib.rs", "utf8");
const move = fs.readFileSync("contracts/sui/powerchain_bridge/Move.toml", "utf8");
const production = process.env.NODE_ENV === "production";
const configuredProgramId = anchor.match(/declare_id!\("([1-9A-HJ-NP-Za-km-z]+)"\)/)?.[1] ?? "";
if (!configuredProgramId) throw new Error("SOLANA_BRIDGE_PROGRAM_ID_MISSING");
if (!/powerchain_bridge\s*=\s*"0x0"/.test(move)) throw new Error("SUI_SOURCE_ADDRESS_MUST_REMAIN_0X0");
if (production) {
  const sui = process.env.POWERCHAIN_SUI_BRIDGE_PACKAGE_ID?.trim()?.toLowerCase() ?? "";
  if (!/^0x[0-9a-f]{64}$/.test(sui)) throw new Error("PRODUCTION_SUI_BRIDGE_PACKAGE_ID_REQUIRED");
}
console.log(`program-placeholders: source Sui alias fail-closed; Solana program ${configuredProgramId}; runtime deployment ${production ? "required" : "optional"}`);
