import type { Metadata } from "next";
import { WalletOverviewClient } from "@/components/wallet/wallet-overview-client";
export const metadata: Metadata = {
  title: "Wallet",
  description: "Inspect connected Solana and Sui wallets, finalized balances, claim readiness and cross-chain activity.",
};

export const dynamic = "force-dynamic";
export default function WalletPage() { return <WalletOverviewClient />; }
