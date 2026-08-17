import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircledIcon,
  LightningBoltIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons";
import { AILogo } from "@/website/shared/ui/ai-logo";

const trust = [
  "Wallet-signed execution",
  "Explicit finality checks",
  "Server-side secret boundaries",
] as const;

const capabilities = [
  ["Swap", "Solana + Sui"],
  ["Bridge", "Wormhole NTT"],
  ["Staking", "Deployment gated"],
  ["AI", "Advisory only"],
] as const;

export function Hero() {
  return (
    <section className="web-hero overflow-hidden border-b border-slate-200/70 dark:border-white/10">
      <div className="web-hero-art" aria-hidden="true" />
      <div className="web-container relative z-10 flex min-h-[760px] flex-col items-center justify-center py-24 text-center sm:min-h-[800px] sm:py-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#173b2d]/10 bg-white/90 px-3.5 py-2 text-xs font-bold text-[#294a3b] shadow-[0_8px_30px_rgba(23,59,45,.07)] backdrop-blur-sm dark:border-white/10 dark:bg-white/[.06] dark:text-[#c4d4cc]">
          <LightningBoltIcon /> Wallet-controlled financial intelligence
        </div>

        <h1 className="mt-7 max-w-5xl text-balance text-5xl font-semibold tracking-[-.055em] text-[#09110e] dark:text-white sm:text-6xl lg:text-[5.4rem] lg:leading-[.98]">
          Operate digital finance with AI context—not AI custody.
        </h1>
        <p className="mx-auto mt-7 max-w-3xl text-balance text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
          PowerChain unifies advisory AI, swaps, cross-chain settlement, staking, portfolio intelligence and provider diagnostics across Solana and Sui while your wallet stays in control.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/open/dashboard" className="web-button web-button-primary gap-2 px-5">
            Open workspace <ArrowRightIcon />
          </Link>
          <Link href="#products" className="web-button web-button-secondary px-5">
            Explore products
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
          {trust.map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <CheckCircledIcon className="text-[#294a3b] dark:text-[#a7c2b4]" />
              {item}
            </span>
          ))}
        </div>

        <div className="web-command-card mt-14 w-full max-w-5xl text-left">
          <div className="flex flex-col gap-5 border-b border-slate-200/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-white/10">
            <div className="flex items-center gap-3">
              <AILogo size={44} />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#567064] dark:text-[#b7c8c0]">PowerChain workspace</p>
                <p className="mt-1 text-lg font-semibold text-[#102b21] dark:text-white">Cross-chain command center</p>
              </div>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d5dfda] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#294a3b] dark:border-white/10 dark:bg-white/[.05] dark:text-slate-300">
              <LockClosedIcon /> Wallet approval required
            </div>
          </div>

          <div className="grid gap-px overflow-hidden bg-slate-200/80 sm:grid-cols-2 lg:grid-cols-4 dark:bg-white/10">
            {capabilities.map(([title, detail]) => (
              <div key={title} className="bg-white/95 p-5 backdrop-blur-sm dark:bg-[#101714]/95">
                <p className="text-sm font-semibold text-[#102b21] dark:text-white">{title}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
