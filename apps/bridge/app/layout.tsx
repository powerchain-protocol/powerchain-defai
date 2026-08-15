import type { Metadata } from "next";
import Link from "next/link";
import { AppProviders } from "@/components/providers/app-providers";
import { HeaderWalletControls } from "@/components/wallet/header-wallet-controls";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PowerChain Bridge", template: "%s | PowerChain Bridge" },
  description: "PWRC ↔ wPWRC Wormhole NTT bridge for Solana and Sui",
};

const navigation = [
  ["Bridge", "/bridge"], ["Wallet", "/wallet"], ["Claim", "/claim"],
  ["Assets", "/assets"], ["History", "/history"], ["Fees", "/fees"],
] as const;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="min-h-screen bg-slate-50 text-slate-950 antialiased dark:bg-[#07142D] dark:text-white">
    <AppProviders>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-[#07142D]">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/bridge" className="shrink-0 font-semibold tracking-tight">PowerChain Bridge™</Link>
          <nav className="hidden flex-1 items-center gap-1 text-sm lg:flex" aria-label="Primary">
            {navigation.map(([label,href]) => <Link key={href} className="rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white" href={href}>{label}</Link>)}
          </nav>
          <div className="ml-auto"><HeaderWalletControls /></div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 text-xs lg:hidden" aria-label="Mobile primary">
          {navigation.map(([label,href]) => <Link key={href} className="shrink-0 rounded-lg px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900" href={href}>{label}</Link>)}
        </nav>
      </header>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </AppProviders>
  </body></html>;
}
