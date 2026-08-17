import Link from "next/link";
import { ArrowRightIcon, CheckCircledIcon, LightningBoltIcon, LockClosedIcon } from "@radix-ui/react-icons";
import { AILogo } from "@/website/shared/ui/ai-logo";
import { ProductIcon, type ProductIconName } from "@/website/shared/ui/product-icon";

const trust = ["Wallet-signed execution", "Explicit finality checks", "Server-side secret boundaries"] as const;

const capabilities: readonly [ProductIconName, string, string, string][] = [
  ["swap", "Swap", "Solana + Sui", "Provider-aware"],
  ["bridge", "Bridge", "Wormhole NTT", "Reconciled"],
  ["staking", "Staking", "Deployment gated", "Evidence-first"],
  ["assistant", "AI", "Advisory only", "No custody"],
];

export function Hero() {
  return (
    <section className="web-hero overflow-hidden border-b border-slate-200/70 dark:border-white/10">
      <div className="web-hero-art" aria-hidden="true" />
      <div className="web-container relative z-10 flex min-h-[760px] flex-col items-center justify-center py-24 text-center sm:min-h-[800px] sm:py-28">
        <div className="web-hero-pill"><LightningBoltIcon /> Wallet-controlled financial intelligence</div>

        <h1 className="web-display mt-7 max-w-5xl text-balance text-5xl font-semibold tracking-[-.055em] text-brand-950 dark:text-brand-100 sm:text-6xl lg:text-[5.4rem] lg:leading-[.98]">
          Operate digital finance with AI context—not AI custody.
        </h1>
        <p className="web-hero-copy mx-auto mt-7 max-w-3xl text-balance text-lg leading-8 sm:text-xl">
          PowerChain unifies advisory AI, swaps, cross-chain settlement, staking, portfolio intelligence and provider diagnostics across Solana and Sui while your wallet stays in control.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/open/dashboard" className="web-button web-button-primary gap-2 px-5">Open workspace <ArrowRightIcon /></Link>
          <Link href="#products" className="web-button web-button-secondary px-5">Explore products</Link>
        </div>

        <div className="web-trust-row mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {trust.map((item) => <span key={item} className="inline-flex items-center gap-2"><CheckCircledIcon />{item}</span>)}
        </div>

        <div className="web-command-card mt-14 w-full max-w-5xl text-left">
          <div className="web-command-header">
            <div className="flex items-center gap-3">
              <AILogo size={44} />
              <div>
                <p className="web-eyebrow">PowerChain workspace</p>
                <p className="web-display mt-1 text-lg font-semibold text-brand-950 dark:text-brand-100">Cross-chain command center</p>
              </div>
            </div>
            <div className="web-command-lock"><LockClosedIcon /> Wallet approval required</div>
          </div>

          <div className="web-workspace-grid">
            {capabilities.map(([icon, title, detail, status]) => (
              <article key={title} className="web-workspace-card group">
                <div className="flex items-start justify-between gap-3">
                  <ProductIcon name={icon} size={40} />
                  <span className="web-workspace-status"><span aria-hidden="true" />{status}</span>
                </div>
                <p className="web-display mt-4 text-base font-semibold text-brand-950 dark:text-brand-100">{title}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
          <div className="web-command-footer">
            <span>Runtime evidence is refreshed inside the application.</span>
            <Link href="/open/status" className="font-bold text-brand-700 hover:text-brand-900 dark:text-brand-200 dark:hover:text-white">View status →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
