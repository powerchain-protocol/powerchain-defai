import type { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

function positiveBaseUnits(value: string): bigint {
  if (!/^[1-9][0-9]*$/.test(value)) throw new Error("SERVICE_FEE_AMOUNT_INVALID");
  return BigInt(value);
}

/**
 * Add a Sui fee transfer to the same user-owned source transaction that performs
 * the NTT bridge operation. The transaction remains wallet-signed by the user.
 */
export function appendSuiServiceFeeTransfer(input: {
  transaction: Transaction;
  sourceCoinObjectId: string;
  recipient: string;
  feeBaseUnits: string;
}) {
  const amount = positiveBaseUnits(input.feeBaseUnits);
  const recipient = normalizeSuiAddress(input.recipient);
  const sourceCoin = input.transaction.object(input.sourceCoinObjectId);
  const [feeCoin] = input.transaction.splitCoins(sourceCoin, [input.transaction.pure.u64(amount)]);
  if (!feeCoin) throw new Error("SERVICE_FEE_SUI_SPLIT_FAILED");
  input.transaction.transferObjects([feeCoin], recipient);
  return Object.freeze({
    chain: "SUI" as const,
    recipient,
    feeBaseUnits: amount.toString(),
    sourceCoinObjectId: input.sourceCoinObjectId,
  });
}
