import type { Metadata } from "next";
import Link from "next/link";
import { PrimaryNavigation } from "@/components/navigation/primary-navigation";
import { AppProviders } from "@/components/providers/app-providers";
import { HeaderWalletControls } from "@/components/wallet/header-wallet-controls";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PowerChain Bridge", template: "%s | PowerChain Bridge" },
  description: "PWRC ↔ wPWRC Wormhole NTT bridge for Solana and Sui",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-950 antialiased dark:bg-[#07142D] dark:text-white">
        <AppProviders>
          <a
            href="#main-content"
            className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-lg focus:not-sr-only dark:bg-slate-900 dark:text-white"
          >
            Skip to main content
          </a>
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 supports-[backdrop-filter]:bg-white/90 supports-[backdrop-filter]:backdrop-blur dark:border-slate-800 dark:bg-[#07142D]/95">
            <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
              <Link href="/bridge" className="shrink-0 font-semibold tracking-tight" aria-label="PowerChain Bridge home">
                PowerChain Bridge™
              </Link>
              <PrimaryNavigation />
              <div className="ml-auto">
                <HeaderWalletControls />
              </div>
            </div>
            <PrimaryNavigation mobile />
          </header>
          <div id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 py-6 outline-none sm:px-6 lg:px-8">
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
