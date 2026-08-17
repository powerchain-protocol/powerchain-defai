import Link from "next/link";
import { ProductIcon, type ProductIconName } from "@/website/shared/ui/product-icon";

type Product = {
  title: string;
  body: string;
  icon: ProductIconName;
  href: string;
  action: string;
  badge?: string;
};

const products: Product[] = [
  { icon: "assistant", badge: "AI", title: "DeFAI Assistant", body: "Contextual guidance for routes, liquidity, staking and operational risk without transaction authority.", href: "/open/chat", action: "Open assistant" },
  { icon: "agent", badge: "Agent", title: "Agent Workspace", body: "Structured research and action preparation with explicit review boundaries before wallet-controlled execution.", href: "/open/chat", action: "Open workspace" },
  { icon: "chat", badge: "Chat", title: "AI Chat", body: "A focused conversational surface for portfolio context, protocol questions and operational diagnostics.", href: "/open/chat", action: "Start chat" },
  { icon: "swap", title: "Multi-chain Swap", body: "Wallet-signed Solana and Sui execution with provider-aware quoting, token-specific controls and explicit transaction review.", href: "/open/swap", action: "Open swap" },
  { icon: "bridge", title: "Wormhole NTT Bridge", body: "PWRC/wPWRC principal movement with persisted status, reconciliation, recovery and finality verification.", href: "/open/bridge", action: "Open bridge" },
  { icon: "staking", title: "Staking", body: "Deployment-gated staking surfaces that never invent APR, pool state or reward availability.", href: "/open/staking", action: "Open staking" },
  { icon: "wallet", title: "Wallet & Assets", body: "Connected-wallet portfolio, canonical asset identity and activity surfaces with explicit chain separation.", href: "/open/wallet", action: "Open wallet" },
  { icon: "status", title: "Runtime Status", body: "Fail-closed provider, worker, queue and route-policy evidence with operator-facing freshness and recovery context.", href: "/open/status", action: "View status" },
];

export function Products() {
  return (
    <section id="products" className="web-section py-24 sm:py-28">
      <div className="web-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="web-eyebrow">Products</p>
          <h2 className="web-section-title mt-4">One workspace. Deliberate execution boundaries.</h2>
          <p className="web-section-copy mx-auto mt-5 max-w-2xl">Each product gets its own interaction language while sharing the same wallet, runtime and observability foundations.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {products.map(({ icon, title, body, badge, href, action }) => (
            <article key={title} className="web-card group flex min-h-[310px] flex-col rounded-[24px] p-6 sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <ProductIcon name={icon} />
                {badge ? <span className="rounded-full border border-[#d8e0dc] bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#294a3b] dark:border-white/10 dark:bg-white/[.04] dark:text-[#b7c8c0]">{badge}</span> : null}
              </div>
              <h3 className="web-display mt-5 text-xl font-semibold tracking-[-.02em] text-brand-950 dark:text-brand-100">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{body}</p>
              <div className="mt-auto pt-6">
                <Link href={href} className="inline-flex min-h-10 items-center gap-2 rounded-[14px] border border-[#d4ddd8] bg-white px-3.5 text-xs font-bold text-[#173b2d] shadow-[0_6px_18px_rgba(23,59,45,.06)] transition hover:-translate-y-0.5 hover:border-[#b9c9c1] hover:shadow-[0_10px_24px_rgba(23,59,45,.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#557568] dark:border-white/10 dark:bg-white/[.045] dark:text-[#dce8e2] dark:hover:bg-white/[.075]">
                  {action}<span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
