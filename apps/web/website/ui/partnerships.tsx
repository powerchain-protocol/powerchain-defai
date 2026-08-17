import { EcosystemIcon } from "@/website/shared/ui/ecosystem-icon";

const partners = [
  ["Solana", "Execution network"],
  ["Sui", "Execution network"],
  ["Pyth", "Market data"],
  ["Supabase", "Data infrastructure"],
  ["Wormhole", "Cross-chain messaging"],
  ["Jupiter", "Solana liquidity"],
  ["Cetus", "Sui liquidity"],
  ["Cloudflare", "Edge infrastructure"],
] as const;

export function Partnerships() {
  return (
    <section id="partners" className="web-section web-section-soft border-y border-slate-200/70 py-24 dark:border-white/10 sm:py-28">
      <div className="web-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="web-eyebrow">Ecosystem</p>
          <h2 className="web-section-title mt-4">Designed around proven infrastructure.</h2>
          <p className="web-section-copy mx-auto mt-5 max-w-2xl">Provider availability is verified at runtime. Brand marks identify integration targets and do not imply endorsement or guaranteed availability.</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {partners.map(([name, role]) => (
            <div key={name} className="web-card group flex min-h-36 items-center gap-4 rounded-[20px] p-4 sm:flex-col sm:justify-center sm:p-5 sm:text-center">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_24px_rgba(23,59,45,.07)] transition group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_30px_rgba(23,59,45,.10)] dark:border-white/10 dark:bg-white/[.06]">
                <EcosystemIcon name={name} size={34} />
              </span>
              <span className="min-w-0">
                <b className="web-display block text-sm font-semibold text-brand-950 dark:text-brand-100">{name}</b>
                <small className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">{role}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
