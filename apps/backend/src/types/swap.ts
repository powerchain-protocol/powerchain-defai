import type { MevProtection } from "./mev";
export type { SwapChain, SwapProvider, SwapVenue, SwapExecutionState, SwapFeeMode, CanonicalSwapIntent, SwapQuoteProtection } from "@powerchain/swap-core";
import type { SwapChain } from "@powerchain/swap-core";
export type SwapRequest = { chain: SwapChain; inputToken: string; outputToken: string; amountBaseUnits: string; payer: string; protection: MevProtection };
