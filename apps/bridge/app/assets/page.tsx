import { BridgedAssetsCard } from "@/components/bridge/bridged-assets-card";
import { TrustedAssetsCard } from "@/components/assets/trusted-assets-card";
import { MultichainPortfolioCard } from "@/components/portfolio/multichain-portfolio-card";
import { DexPoolsCard } from "@/components/pools/dex-pools-card";
export default function AssetsPage(){return <main className="mx-auto w-full max-w-6xl space-y-5 py-2 sm:py-4"><div><p className="text-sm font-medium text-[#294a3b] dark:text-[#adc0b6]">Assets & liquidity</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Trusted assets, portfolio and pools</h1><p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">Inspect canonical PWRC/wPWRC, trusted swap assets, connected-wallet balances, and DEX pool discovery across Solana and Sui.</p></div><TrustedAssetsCard/><MultichainPortfolioCard/><DexPoolsCard/><BridgedAssetsCard/></main>}
