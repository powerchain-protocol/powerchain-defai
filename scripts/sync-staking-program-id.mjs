import fs from "node:fs";
import path from "node:path";

const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const root = process.cwd();
const keypairPath = path.resolve(root, process.argv[2] ?? "programs/solana/target/deploy/powerchain_staking-keypair.json");

function base58Encode(bytes) {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  let encoded = "";
  while (value > 0n) {
    const remainder = Number(value % 58n);
    encoded = alphabet[remainder] + encoded;
    value /= 58n;
  }
  let leadingZeroes = 0;
  while (leadingZeroes < bytes.length && bytes[leadingZeroes] === 0) leadingZeroes += 1;
  return "1".repeat(leadingZeroes) + (encoded || "1");
}

if (!fs.existsSync(keypairPath)) throw new Error(`STAKING_PROGRAM_KEYPAIR_NOT_FOUND:${keypairPath}`);
const secret = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
if (!Array.isArray(secret) || secret.length !== 64 || secret.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
  throw new Error("STAKING_PROGRAM_KEYPAIR_INVALID");
}
const programId = base58Encode(Uint8Array.from(secret.slice(32)));
if (programId === "Stake11111111111111111111111111111111111111") throw new Error("STAKING_PROGRAM_ID_PLACEHOLDER_FORBIDDEN");

const rustPath = path.join(root, "programs/solana/powerchain_staking/src/lib.rs");
const anchorPath = path.join(root, "programs/solana/Anchor.toml");
const configPath = path.join(root, "config/staking.json");
let rust = fs.readFileSync(rustPath, "utf8");
let anchor = fs.readFileSync(anchorPath, "utf8");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

rust = rust.replace(/declare_id!\("[1-9A-HJ-NP-Za-km-z]+"\);/, `declare_id!("${programId}");`);
anchor = anchor.replace(/powerchain_staking\s*=\s*"[1-9A-HJ-NP-Za-km-z]+"/, `powerchain_staking = "${programId}"`);
config.solana.sourceProgramId = programId;
config.solana.deploymentVerified = false;

fs.writeFileSync(rustPath, rust);
fs.writeFileSync(anchorPath, anchor);
fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`POWERCHAIN_STAKING_PROGRAM_ID_SYNCED ${programId}`);
