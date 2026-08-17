import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PowerChain DeFAI", template: "%s | PowerChain DeFAI" },
  description: "Wallet-controlled AI-assisted DeFi infrastructure for Solana and Sui.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
