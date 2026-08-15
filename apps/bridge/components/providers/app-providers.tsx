"use client";

import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { DAppKitProvider, createDAppKit } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";

function publicSolanaRpc() {
  return process.env.NEXT_PUBLIC_SOLANA_WALLET_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com";
}
function publicSuiRpc() {
  return process.env.NEXT_PUBLIC_SUI_WALLET_RPC_URL?.trim() || "https://fullnode.mainnet.sui.io:443";
}

const suiDAppKit = createDAppKit({
  networks: ["mainnet"],
  defaultNetwork: "mainnet",
  createClient: (network) => new SuiGrpcClient({ network, baseUrl: publicSuiRpc() }),
  autoConnect: true,
});

declare module "@mysten/dapp-kit-react" {
  interface Register { dAppKit: typeof suiDAppKit; }
}

export function AppProviders({ children }: { children: ReactNode }) {
  const solanaEndpoint = useMemo(publicSolanaRpc, []);
  return (
    <ConnectionProvider endpoint={solanaEndpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <DAppKitProvider dAppKit={suiDAppKit}>{children}</DAppKitProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
