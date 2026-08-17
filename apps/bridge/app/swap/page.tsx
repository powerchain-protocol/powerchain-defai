import type { Metadata } from "next";
import { TradeWorkspace } from "@/components/trade/trade-workspace";
export const metadata: Metadata = {
  title: "Swap",
  description: "Swap trusted Solana and Sui assets through configured liquidity providers with wallet-controlled signing and explicit route review.",
};

export default function SwapPage(){return <main className="mx-auto max-w-[1100px] space-y-5"><div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#294a3b] dark:text-[#d0dcd6]">PowerChain Trade</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Swap & Bridge</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Swap trusted Solana assets through Jupiter/Raydium/Meteora/Orca liquidity, Sui assets through Cetus, or bridge PWRC/wPWRC with Wormhole NTT. Wallet signatures remain user-controlled.</p></div><TradeWorkspace defaultTab="swap"/></main>}
