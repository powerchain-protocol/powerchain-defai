import Link from "next/link";
import { APP_ROUTES } from "@/config/app-routes";

const surfaces = [
  { name: "DeFAI Assistant", role: "User workspace", href: APP_ROUTES.chat, detail: "AI guidance without wallet signing authority." },
  { name: "Swap", role: "Execution UI", href: APP_ROUTES.swap, detail: "Wallet-signed Solana and Sui trading flows." },
  { name: "Bridge", role: "Cross-chain UI", href: APP_ROUTES.bridge, detail: "Wormhole NTT transfer and recovery lifecycle." },
  { name: "Staking", role: "Protocol UI", href: APP_ROUTES.staking, detail: "Deployment-gated staking with explicit readiness." },
  { name: "Backend API", role: "Canonical service", href: APP_ROUTES.apiDocs, detail: "Versioned API contracts and server-only provider access." },
] as const;

export function ApplicationSuiteCard() {
  return (
    <section className="pc-panel overflow-hidden rounded-3xl" aria-labelledby="application-suite-title">
      <div className="border-b border-slate-200/80 px-5 py-5 sm:px-6 dark:border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#294a3b] dark:text-[#adc0b6]">Application suite</p>
            <h2 id="application-suite-title" className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">One runtime, separated responsibilities</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">The monorepo exposes focused product surfaces while keeping signing in the wallet and privileged provider access on the server.</p>
          </div>
          <span className="rounded-full border border-[#cbd8d1] bg-[#f1f5f3] px-3 py-1.5 text-xs font-semibold text-[#294a3b] dark:border-[#29483c] dark:bg-[#0b1712] dark:text-[#d0dcd6]">5 integrated surfaces</span>
        </div>
      </div>
      <div className="grid gap-px bg-slate-200/80 sm:grid-cols-2 xl:grid-cols-5 dark:bg-white/10">
        {surfaces.map((surface) => (
          <Link key={surface.name} href={surface.href} className="group min-h-40 bg-white p-5 transition hover:bg-[#f7faf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#35584a] dark:bg-[#09110e] dark:hover:bg-[#0d1814]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{surface.role}</span>
            <div className="mt-2 flex items-center gap-2">
              <h3 className="font-semibold text-slate-950 dark:text-white">{surface.name}</h3>
              <span aria-hidden="true" className="translate-x-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#294a3b] dark:group-hover:text-[#adc0b6]">→</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{surface.detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
