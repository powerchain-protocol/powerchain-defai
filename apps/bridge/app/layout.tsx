import type { Metadata, Viewport } from "next";
import { ApplicationShell } from "@/components/navigation/application-shell";
import { AppProviders } from "@/components/providers/app-providers";
import { ThemeBootstrap } from "@/components/providers/theme-bootstrap";
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
          <ApplicationShell>{children}</ApplicationShell>
        </AppProviders>
      </body>
    </html>
  );
}
