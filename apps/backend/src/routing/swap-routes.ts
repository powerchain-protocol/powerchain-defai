import type { RouteDefinition } from "./routes";

export const SWAP_ROUTES = [
  { id: "swap-balance", method: "GET", path: "/api/v1/swap/balance", risk: "wallet-read", rateLimit: "standard" },
  { id: "swap-quote", method: "POST", path: "/api/v1/swap/quote", risk: "wallet-write", rateLimit: "strict" },
  { id: "swap-transaction", method: "POST", path: "/api/v1/swap/transaction", risk: "wallet-write", rateLimit: "strict" },
  { id: "swap-solana-order", method: "POST", path: "/api/v1/swap/solana/order", risk: "wallet-write", rateLimit: "strict" },
  { id: "swap-solana-execute", method: "POST", path: "/api/v1/swap/solana/execute", risk: "wallet-write", rateLimit: "strict" },
  { id: "swap-receipt", method: "POST", path: "/api/v1/swap/receipt", risk: "wallet-write", rateLimit: "strict" },
] as const satisfies readonly RouteDefinition[];
