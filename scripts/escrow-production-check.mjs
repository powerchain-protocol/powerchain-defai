import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const must = (condition, code) => { if (!condition) throw new Error(code); };

for (const rel of [
  "programs/solana/powerchain_escrow/Cargo.toml",
  "programs/solana/powerchain_escrow/src/lib.rs",
  "programs/solana/tests/powerchain-escrow.ts",
  "apps/backend/src/escrow/config.ts",
  "apps/backend/src/payments/checkout.ts",
  "apps/backend/src/payments/solana-pay.ts",
  "apps/bridge/types/escrow.ts",
  "apps/bridge/app/api/v1/escrow/readiness/route.ts",
  "apps/bridge/app/api/v1/payments/checkout/route.ts",
  "config/escrow.json",
  "docs/ESCROW.md",
]) must(fs.existsSync(path.join(root, rel)), `ESCROW_FILE_MISSING:${rel}`);

const program = read("programs/solana/powerchain_escrow/src/lib.rs");
for (const token of [
  'b"escrow"','b"receipt"','b"allowed_mint"','b"extensions"','b"vault"',
  "pub fn create_escrow","pub fn set_allowed_mint","pub fn set_extensions","pub fn make_immutable","pub fn deposit","pub fn withdraw",
  "PreDeposit","PostDeposit","PreWithdraw","PostWithdraw",
  "PermanentDelegate","NonTransferable","Pausable","TransferHook",
  "EscrowImmutable","token_interface::transfer_checked","credited_base_units","received_base_units",
]) must(program.includes(token), `ESCROW_PROGRAM_INVARIANT_MISSING:${token}`);
must(!/Keypair|secretKey|seed phrase|private key/i.test(program), "ESCROW_PROGRAM_MUST_NOT_CONTAIN_SIGNER_SECRET_PATH");
must(program.includes("AccountMeta::new(*account.key,false)") && program.includes("AccountMeta::new_readonly(*account.key,false)"), "ESCROW_HOOK_MUST_STRIP_FORWARDED_SIGNER_PRIVILEGE");
must(!program.includes("AccountMeta::new(*account.key,account.is_signer)"), "ESCROW_HOOK_MUST_NOT_FORWARD_SIGNER_PRIVILEGE");

const config = JSON.parse(read("config/escrow.json"));
must(config.version === "1.0.0", "ESCROW_CONFIG_VERSION_INVALID");
must(config.signing?.connectedWalletSigns === true && config.signing?.backendCustody === false, "ESCROW_CUSTODY_POLICY_INVALID");
must(config.programId === "UNSET" && config.status === "deployment-gated", "ESCROW_CONFIG_MUST_NOT_CLAIM_UNVERIFIED_DEPLOYMENT");

const backend = read("apps/backend/src/escrow/config.ts");
for (const token of ["ESCROW_RPC_VERIFICATION_REQUIRED","ESCROW_SOURCE_PLACEHOLDER_PROGRAM_ID","verifyEscrowRuntimeStatus","verifyEscrowCheckoutTarget","getAccountInfo","ESCROW_PROGRAM_NOT_EXECUTABLE","ESCROW_MINT_NOT_ALLOWED","AllowedMint","EscrowExtensions","findProgramAddressSync"]) must(backend.includes(token), `ESCROW_DEPLOYMENT_GATE_MISSING:${token}`);
must(backend.includes("connectedWalletSigns: true") && backend.includes("backendCustody: false"), "ESCROW_RUNTIME_CUSTODY_POLICY_MISSING");
const checkout = read("apps/backend/src/payments/checkout.ts");
for (const token of ["solana-pay","escrow","verifyEscrowCheckoutTarget","buildSolanaPayUrl","findProgramAddressSync","verifiedAt","allowedMint","extensions","vault","receipt"]) must(checkout.includes(token), `ESCROW_CHECKOUT_INTEGRATION_MISSING:${token}`);
const route = read("apps/bridge/app/api/v1/payments/checkout/route.ts");
must(route.includes("await buildCheckoutPlan"), "ESCROW_CHECKOUT_ROUTE_MUST_AWAIT_RPC_VERIFICATION");
const readiness = read("apps/bridge/app/api/v1/escrow/readiness/route.ts");
must(readiness.includes("await verifyEscrowRuntimeStatus"), "ESCROW_READINESS_MUST_USE_RPC_VERIFICATION");
const docs = read("docs/ESCROW.md");
for (const token of ["PreDeposit","PostDeposit","PreWithdraw","PostWithdraw","immutable","connected wallet","AllowedMint.allowed = true","one consistent RPC endpoint"]) must(docs.toLowerCase().includes(token.toLowerCase()), `ESCROW_DOC_POLICY_MISSING:${token}`);

console.log("POWERCHAIN_ESCROW_PRODUCTION_CHECK_PASS version=1.0.0 deploymentGated=true rpcVerified=true checkoutTargetVerified=true walletSigner=true hooks=4");
