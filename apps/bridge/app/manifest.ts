import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PowerChain DeFAI",
    short_name: "PowerChain",
    description: "AI-assisted DeFi workspace for wallet-signed Swap, Wormhole NTT Bridge, staking, portfolio and liquidity on Solana and Sui.",
    start_url: "/chat",
    scope: "/",
    display: "standalone",
    background_color: "#eef1ef",
    theme_color: "#eef1ef",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
