export type PersistedSwapExecutionStatus = "QUOTED"|"AWAITING_SIGNATURE"|"SUBMITTED"|"CONFIRMED"|"FAILED";
export type WalletBalanceSnapshotInput = { wallet:string; chain:"SOLANA"|"SUI"; asset:string; amountBaseUnits:string; decimals:number; source:string; observedAt:Date };
