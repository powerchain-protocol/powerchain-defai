import { createDAppKit } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";

const GRPC_URLS = {
  mainnet: process.env.NEXT_PUBLIC_SUI_WALLET_RPC_URL?.trim() || process.env.NEXT_PUBLIC_SUI_MAINNET_GRPC_URL?.trim() || "https://fullnode.mainnet.sui.io:443",
  testnet: process.env.NEXT_PUBLIC_SUI_TESTNET_GRPC_URL?.trim() || "https://fullnode.testnet.sui.io:443",
  devnet: process.env.NEXT_PUBLIC_SUI_DEVNET_GRPC_URL?.trim() || "https://fullnode.devnet.sui.io:443",
} as const;

export const websiteSuiDAppKit = createDAppKit({
  networks: ["mainnet", "testnet", "devnet"],
  defaultNetwork: "mainnet",
  createClient: (network) => new SuiGrpcClient({ network, baseUrl: GRPC_URLS[network] }),
  autoConnect: true,
});

declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: typeof websiteSuiDAppKit;
  }
}
