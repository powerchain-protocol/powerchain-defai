export function CloudflareEdgeCard() {
  const enabled = process.env.NEXT_PUBLIC_CLOUDFLARE_ENABLED === "true";
  return (
    <section className="pc-cinematic-panel relative overflow-hidden rounded-3xl p-5 text-white sm:p-6" aria-labelledby="cloudflare-edge-title">
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-white/[0.04] blur-2xl" aria-hidden="true" />
      <div className="relative grid gap-6 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d0dcd6]">Edge runtime</span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${enabled ? "bg-[#29483c]/35 text-[#d0dcd6] ring-1 ring-inset ring-[#8ea69a]/25" : "bg-white/[0.06] text-slate-300 ring-1 ring-inset ring-white/10"}`}>{enabled ? "Configured" : "Optional"}</span>
          </div>
          <h2 id="cloudflare-edge-title" className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">Cloudflare Workers deployment target</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">OpenNext support is wired for production preview and deployment without replacing the existing standalone Node target. Secrets stay server-side and static assets use immutable caching where safe.</p>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><dt className="text-slate-400">Runtime</dt><dd className="mt-1 font-semibold text-white">Workers / workerd</dd></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><dt className="text-slate-400">Adapter</dt><dd className="mt-1 font-semibold text-white">OpenNext</dd></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><dt className="text-slate-400">Node APIs</dt><dd className="mt-1 font-semibold text-white">nodejs_compat</dd></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><dt className="text-slate-400">Telemetry</dt><dd className="mt-1 font-semibold text-white">Workers observability</dd></div>
        </dl>
      </div>
    </section>
  );
}
