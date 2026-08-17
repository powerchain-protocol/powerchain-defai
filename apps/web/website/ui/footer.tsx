import Link from "next/link";
import { Logo } from "@/website/shared/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-white/10 dark:bg-[#08100c]">
      <div className="web-container grid gap-7 py-10 lg:grid-cols-[1.2fr_.8fr] lg:items-start">
        <div>
          <Logo />
          <p className="mt-3 max-w-lg text-xs leading-5 text-slate-500 dark:text-slate-400">Wallet-controlled AI-assisted DeFi infrastructure for Solana and Sui. PowerChain prepares and validates; connected wallets remain signing authority.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:grid-cols-3 lg:justify-self-end">
          <Link href="/">Home</Link><Link href="/pages/about">About</Link><Link href="/pages/security">Security</Link>
          <Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/cookies">Cookies</Link>
          <Link href="/legal/disclaimer">Risk disclaimer</Link><Link href="/open/status">Status</Link><Link href="/open/dashboard">Open app</Link>
        </div>
        <p className="text-[11px] text-slate-400 lg:col-span-2">© 2026 PowerChain. Provider availability and blockchain state are verified at runtime.</p>
      </div>
    </footer>
  );
}
