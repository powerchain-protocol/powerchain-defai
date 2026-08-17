import { createDAppKit } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";

export function createPowerChainSuiDAppKit(baseUrl?: string) {
  return createDAppKit({
    networks: ["mainnet"],
    defaultNetwork: "mainnet",
    createClient: (network) => new SuiGrpcClient({
      network,
      baseUrl: baseUrl?.trim() || process.env.NEXT_PUBLIC_SUI_WALLET_RPC_URL?.trim() || "https://fullnode.mainnet.sui.io:443",
    }),
    autoConnect: true,
  });
}

export const suiDAppKit = createPowerChainSuiDAppKit();

declare module "@mysten/dapp-kit-react" {
  interface Register { dAppKit: typeof suiDAppKit }
}
