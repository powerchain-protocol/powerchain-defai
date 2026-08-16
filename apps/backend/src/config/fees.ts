export const POWERCHAIN_SWAP_FEE_BPS=250 as const;
export const BPS_DENOMINATOR=10_000n;
export function calculateServiceFee(amountBaseUnits:string,bps=POWERCHAIN_SWAP_FEE_BPS){if(!/^\d+$/.test(amountBaseUnits))throw new Error("INVALID_BASE_UNITS");if(!Number.isInteger(bps)||bps<0||bps>10_000)throw new Error("INVALID_FEE_BPS");return (BigInt(amountBaseUnits)*BigInt(bps)/BPS_DENOMINATOR).toString()}
