import { POWERCHAIN_NETWORKS } from "@/config/networks";

export function CrossChainFoundationCard() {
  const solana = POWERCHAIN_NETWORKS.find((network) => network.chain === "SOLANA");
  const sui = POWERCHAIN_NETWORKS.find((network) => network.chain === "SUI");
  return (
    <section className="pc-cinematic-panel overflow-hidden rounded-3xl p-5 sm:p-6" aria-labelledby="cross-chain-foundation-title">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Cross-chain foundation</p>
          <h2 id="cross-chain-foundation-title" className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">Solana ↔ Sui</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Shared cluster and address rules now drive Swap, Bridge, portfolio and RPC context. Wormhole NTT remains the only PWRC/wPWRC principal-movement protocol.</p>
        </div>
        <span className="rounded-full border border-[#cfd8d3] bg-white/75 px-3 py-1.5 text-xs font-semibold text-[#233e33] dark:border-[#2a3b34] dark:bg-black/30 dark:text-slate-200">2 chains · 8 supported clusters</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[solana, sui].filter(Boolean).map((network) => network && (
          <article key={network.chain} className="rounded-2xl border border-white/70 bg-white/65 p-4 shadow-sm dark:border-white/10 dark:bg-black/25">
            <div className="flex items-center justify-between gap-3">
              <div><p className="font-semibold text-slate-950 dark:text-white">{network.name}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{network.clusterId}</p></div>
              <span className="rounded-full bg-[#eef1ef] px-2.5 py-1 text-[11px] font-medium text-[#31483e] dark:bg-white/10 dark:text-slate-200">{network.network}</span>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{network.transport.read} · {network.transport.realtime}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
