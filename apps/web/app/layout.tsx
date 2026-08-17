import type { Metadata } from "next";
import { WebsiteWalletProvider } from "@/website/providers/wallet-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PowerChain DeFAI", template: "%s | PowerChain DeFAI" },
  description: "Wallet-controlled AI-assisted DeFi infrastructure for Solana and Sui.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><WebsiteWalletProvider>{children}</WebsiteWalletProvider></body></html>;
}
