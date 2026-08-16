import type { Metadata, Viewport } from "next";
import { AppFooter } from "@/components/navigation/app-footer";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { BrandLogo } from "@/components/navigation/brand-logo";
import { MobileBottomNavigation } from "@/components/navigation/mobile-bottom-navigation";
import { MobileNavigationMenu } from "@/components/navigation/mobile-navigation-menu";
import { AppProviders } from "@/components/providers/app-providers";
import { ThemeBootstrap } from "@/components/providers/theme-bootstrap";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HeaderWalletControls } from "@/components/wallet/header-wallet-controls";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PowerChain DeFAI", template: "%s | PowerChain DeFAI" },
  description: "PowerChain DeFAI workspace for AI-assisted DeFi, Swap, Wormhole NTT Bridge, staking, portfolio and liquidity on Solana and Sui",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "PowerChain DeFAI", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#eef1ef",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head><ThemeBootstrap /></head>
      <body className="min-h-screen bg-transparent text-slate-950 antialiased dark:text-slate-100">
        <AppProviders>
          <a
            href="#main-content"
            className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-lg focus:not-sr-only dark:bg-slate-900 dark:text-white"
          >
            Skip to main content
          </a>
          <div className="min-h-screen lg:flex">
            <AppSidebar />
            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
              <header className="pc-glass sticky top-0 z-40 border-x-0 border-t-0 lg:static">
                <div className="mx-auto flex min-h-16 w-full max-w-[1500px] items-center gap-3 px-4 sm:px-6 lg:min-h-20 lg:px-8">
                  <div className="flex items-center gap-2 lg:hidden">
                    <BrandLogo compact />
                    <span className="hidden text-sm font-semibold tracking-tight text-slate-950 sm:block dark:text-white">PowerChain DeFAI</span>
                  </div>
                  <div className="hidden min-w-0 flex-1 lg:block">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#294a3b] dark:text-[#d0dcd6]">PowerChain</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-500">AI-assisted DeFi workspace · wallet controlled</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2"><ThemeToggle /><HeaderWalletControls /><MobileNavigationMenu /></div>
                </div>
              </header>
              <div id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-28 pt-5 outline-none sm:px-6 lg:px-8 lg:pb-8 lg:pt-7">
                {children}
              </div>
              <div className="hidden lg:block"><AppFooter /></div>
            </div>
          </div>
          <MobileBottomNavigation />
        </AppProviders>
      </body>
    </html>
  );
}
