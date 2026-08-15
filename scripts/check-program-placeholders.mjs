import fs from "node:fs";
const anchor = fs.readFileSync("programs/solana/powerchain_bridge/src/lib.rs", "utf8");
const move = fs.readFileSync("contracts/sui/powerchain_bridge/Move.toml", "utf8");
const production = process.env.NODE_ENV === "production";
const anchorPlaceholder = anchor.includes("Fg6PaFpoGXkYsidMpWxTWqkZxxV2qTnAXg2YS4JpT5jA");
const movePlaceholder = /powerchain_bridge\s*=\s*"0x0"/.test(move);
if (production && (anchorPlaceholder || movePlaceholder)) {
  throw new Error("PRODUCTION_PROTOCOL_PLACEHOLDER_PRESENT");
}
console.log(`program-placeholders: ${anchorPlaceholder || movePlaceholder ? "development placeholders present" : "deployment ids configured"}`);
