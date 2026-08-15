import fs from "node:fs";
import { PublicKey } from "@solana/web3.js";

const solana = process.env.POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID?.trim();
const sui = process.env.POWERCHAIN_SUI_BRIDGE_PACKAGE_ID?.trim()?.toLowerCase();
if (!solana) throw new Error("POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID_REQUIRED");
if (!sui) throw new Error("POWERCHAIN_SUI_BRIDGE_PACKAGE_ID_REQUIRED");
const solanaId = new PublicKey(solana).toBase58();
if (!/^0x[0-9a-f]{64}$/.test(sui)) throw new Error("INVALID_POWERCHAIN_SUI_BRIDGE_PACKAGE_ID");

const rustPath = "programs/solana/powerchain_bridge/src/lib.rs";
const anchorPath = "programs/solana/Anchor.toml";
const movePath = "contracts/sui/powerchain_bridge/Move.toml";
const oldAnchor = "Fg6PaFpoGXkYsidMpWxTWqkZxxV2qTnAXg2YS4JpT5jA";
fs.writeFileSync(rustPath, fs.readFileSync(rustPath, "utf8").replace(/declare_id!\("[1-9A-HJ-NP-Za-km-z]+"\)/, `declare_id!("${solanaId}")`));
fs.writeFileSync(anchorPath, fs.readFileSync(anchorPath, "utf8").replace(new RegExp(oldAnchor, "g"), solanaId));
fs.writeFileSync(movePath, fs.readFileSync(movePath, "utf8").replace(/powerchain_bridge\s*=\s*"0x[0-9a-fA-F]+"/, `powerchain_bridge = "${sui}"`));
console.log("Protocol deployment ids synchronized from environment.");
