import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { CookiePreferencesButton } from "@/components/legal/cookie-preferences-button";

const footerLinks = [
  ["AI Assistant", "/chat"],
  ["Swap", "/swap"],
  ["Bridge", "/bridge"],
  ["Staking", "/staking"],
  ["Wallet", "/wallet"],
  ["Claim", "/claim"],
  ["Assets", "/assets"],
  ["History", "/history"],
  ["Explorer", "/explorer"],
  ["Fees", "/fees"],
  ["Integrations", "/integrations"],
] as const;

export function AppFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-[#050807]/80">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-8 py-7 text-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo compact showText />
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
          <p className="max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">PowerChain DeFAI combines advisory AI, wallet-signed Swap, Wormhole NTT Bridge, staking readiness, portfolio and liquidity tooling.</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium" aria-label="Footer">
          {footerLinks.map(([label, href]) => <Link key={href} href={href} className="text-slate-500 transition hover:text-[#264b3b] dark:text-slate-400 dark:hover:text-[#d9e3de]">{label}</Link>)}
          <Link href="/legal/privacy" className="text-slate-500 transition hover:text-[#264b3b] dark:text-slate-400 dark:hover:text-[#d9e3de]">Privacy</Link>
          <Link href="/legal/terms" className="text-slate-500 transition hover:text-[#264b3b] dark:text-slate-400 dark:hover:text-[#d9e3de]">Terms</Link>
          <Link href="/legal/disclaimer" className="text-slate-500 transition hover:text-[#264b3b] dark:text-slate-400 dark:hover:text-[#d9e3de]">Risk</Link>
          <CookiePreferencesButton />
        </nav>
      </div>
    </footer>
  );
}
