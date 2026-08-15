import { assertServiceFeeVerified } from "../fees/settlement";

export interface FinalizableTransfer { id: string }
export interface CompletionRequest { transferId: string }

export async function finality(transfer: FinalizableTransfer) {
  await assertServiceFeeVerified(transfer.id);
  return completeTransferAfterFinalityAndReconciliation({ transferId: transfer.id });
}

async function completeTransferAfterFinalityAndReconciliation(input: CompletionRequest): Promise<CompletionRequest> {
  return input;
}
