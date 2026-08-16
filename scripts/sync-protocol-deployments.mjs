import fs from "node:fs";
import { PublicKey } from "@solana/web3.js";

const solana = process.env.POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID?.trim();
const authority = process.env.POWERCHAIN_SOLANA_BRIDGE_AUTHORITY?.trim();
const sui = process.env.POWERCHAIN_SUI_BRIDGE_PACKAGE_ID?.trim()?.toLowerCase();
if (!solana) throw new Error("POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID_REQUIRED");
if (!authority) throw new Error("POWERCHAIN_SOLANA_BRIDGE_AUTHORITY_REQUIRED");
if (!sui) throw new Error("POWERCHAIN_SUI_BRIDGE_PACKAGE_ID_REQUIRED");
const solanaId = new PublicKey(solana).toBase58();
const authorityId = new PublicKey(authority).toBase58();
if (authorityId === solanaId) throw new Error("SOLANA_BRIDGE_AUTHORITY_MUST_DIFFER_FROM_PROGRAM_ID");
if (!/^0x[0-9a-f]{64}$/.test(sui)) throw new Error("INVALID_POWERCHAIN_SUI_BRIDGE_PACKAGE_ID");

const rustPath = "programs/solana/powerchain_bridge/src/lib.rs";
const anchorPath = "programs/solana/Anchor.toml";
fs.writeFileSync(rustPath, fs.readFileSync(rustPath, "utf8").replace(/declare_id!\("[1-9A-HJ-NP-Za-km-z]+"\)/, `declare_id!("${solanaId}")`));
fs.writeFileSync(anchorPath, fs.readFileSync(anchorPath, "utf8").replace(/(powerchain_bridge\s*=\s*")[1-9A-HJ-NP-Za-km-z]+(")/, `$1${solanaId}$2`));

// Sui source intentionally remains @0x0. Published package IDs are runtime
// deployment configuration and are normalized when Move targets are built.
const movePath = "contracts/sui/powerchain_bridge/Move.toml";
const move = fs.readFileSync(movePath, "utf8");
if (!/powerchain_bridge\s*=\s*"0x0"/.test(move)) throw new Error("SUI_SOURCE_ADDRESS_MUST_REMAIN_0X0");
console.log(`Protocol deployment configuration verified. Solana program: ${solanaId}; authority: ${authorityId}; Sui package: ${sui}`);
