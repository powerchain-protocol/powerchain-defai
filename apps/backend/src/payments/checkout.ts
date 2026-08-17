import { PublicKey } from "@solana/web3.js";
import { buildSolanaPayUrl } from "./solana-pay";
import { verifyEscrowCheckoutTarget } from "../escrow/config";

export type CheckoutSettlement = "solana-pay" | "escrow";
export interface CheckoutRequest { settlement: CheckoutSettlement; recipient: string; amount: string; mint?: string; reference?: string; escrow?: string; receiptSeed?: string }
export interface CheckoutPlan {
  settlement: CheckoutSettlement;
  connectedWalletSigns: true;
  backendCustody: false;
  solanaPayUrl?: string;
  escrow?: {
    programId: string;
    escrow: string;
    depositor: string;
    receiptSeed: string;
    receipt: string;
    mint: string;
    tokenProgramId: string;
    allowedMint: string;
    extensions: string;
    vault: string;
    amountBaseUnits: string;
    verifiedAt: string;
    timelockSlots: string;
    hookProgram?: string;
  };
}

const UINT = /^[1-9]\d*$/;
function pk(value: string | undefined, code: string) { if (!value) throw new Error(code); try { return new PublicKey(value).toBase58(); } catch { throw new Error(code); } }

export async function buildCheckoutPlan(input: CheckoutRequest): Promise<CheckoutPlan> {
  if (input.settlement === "solana-pay") {
    return { settlement: "solana-pay", connectedWalletSigns: true, backendCustody: false, solanaPayUrl: buildSolanaPayUrl({ recipient: input.recipient, amount: input.amount, ...(input.mint ? { splToken: input.mint } : {}), ...(input.reference ? { reference: input.reference } : {}) }) };
  }
  if (!UINT.test(input.amount)) throw new Error("ESCROW_AMOUNT_BASE_UNITS_REQUIRED");
  const depositor = pk(input.recipient, "ESCROW_DEPOSITOR_INVALID");
  const escrow = pk(input.escrow, "ESCROW_ADDRESS_INVALID");
  const mint = pk(input.mint, "ESCROW_MINT_INVALID");
  const receiptSeed = input.receiptSeed?.trim();
  if (!receiptSeed || !/^[0-9a-fA-F]{64}$/.test(receiptSeed)) throw new Error("ESCROW_RECEIPT_SEED_INVALID");

  const verified = await verifyEscrowCheckoutTarget({ escrow, mint });
  const receiptSeedBytes = Buffer.from(receiptSeed, "hex");
  const [receipt] = PublicKey.findProgramAddressSync(
    [Buffer.from("receipt"), new PublicKey(escrow).toBuffer(), new PublicKey(depositor).toBuffer(), new PublicKey(mint).toBuffer(), receiptSeedBytes],
    new PublicKey(verified.programId),
  );
  return {
    settlement: "escrow",
    connectedWalletSigns: true,
    backendCustody: false,
    escrow: {
      programId: verified.programId,
      escrow,
      depositor,
      receiptSeed,
      receipt: receipt.toBase58(),
      mint,
      tokenProgramId: verified.tokenProgramId,
      allowedMint: verified.allowedMint,
      extensions: verified.extensions,
      vault: verified.vault,
      amountBaseUnits: input.amount,
      verifiedAt: verified.checkedAt,
      timelockSlots: verified.timelockSlots,
      ...(verified.hookProgram === undefined ? {} : { hookProgram: verified.hookProgram }),
    },
  };
}
