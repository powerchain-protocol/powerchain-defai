import { BridgedAssetsCard } from "@/components/bridge/bridged-assets-card";

export default function AssetsPage() {
  return <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><div className="mb-6"><p className="text-sm font-medium text-blue-600 dark:text-blue-400">Assets</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">PWRC and bridged assets</h1><p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">Inspect the canonical Solana PWRC asset and its Sui wPWRC representation before bridging.</p></div><BridgedAssetsCard /></main>;
}
