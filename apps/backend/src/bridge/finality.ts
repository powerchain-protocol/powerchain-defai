import { assertServiceFeeVerified } from "../fees/settlement";
export async function finality(t:any){ await assertServiceFeeVerified(t.id);
  return completeTransferAfterFinalityAndReconciliation({transferId:t.id}); }
async function completeTransferAfterFinalityAndReconciliation(x:any){ return x; }
