"use client";

export type BridgeNetwork = "SOLANA" | "SUI";

const LABELS: Record<BridgeNetwork, { name: string; asset: string }> = {
  SOLANA: { name: "Solana", asset: "PWRC" },
  SUI: { name: "Sui", asset: "wPWRC" },
};

export function RouteSelector({ source, destination, onChange, disabled = false }: { source: BridgeNetwork; destination: BridgeNetwork; onChange: (route: { source: BridgeNetwork; destination: BridgeNetwork }) => void; disabled?: boolean }) {
  const swap = () => onChange({ source: destination, destination: source });
  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="route-selector-title">
      <div className="flex items-center justify-between gap-3"><h2 id="route-selector-title" className="text-sm font-semibold text-slate-950 dark:text-white">Route</h2><span className="text-xs font-medium text-slate-500">Wormhole NTT</span></div>
      <div className="mt-3 grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <NetworkButton label="From" network={source} disabled={disabled} onClick={() => source === "SOLANA" ? onChange({ source: "SOLANA", destination: "SUI" }) : onChange({ source: "SUI", destination: "SOLANA" })} />
        <button type="button" onClick={swap} disabled={disabled} aria-label="Reverse bridge direction" className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] sm:my-auto dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">↔</button>
        <NetworkButton label="To" network={destination} disabled={disabled} onClick={swap} />
      </div>
    </section>
  );
}

function NetworkButton({ label, network, disabled, onClick }: { label: string; network: BridgeNetwork; disabled: boolean; onClick: () => void }) {
  const item = LABELS[network];
  return <button type="button" onClick={onClick} disabled={disabled} className="flex min-h-16 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] disabled:cursor-default dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900"><span><span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</span><span className="mt-1 block text-sm font-semibold text-slate-950 dark:text-white">{item.name}</span></span><span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200">{item.asset}</span></button>;
}
