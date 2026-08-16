# DEX swap, pools, liquidity and portfolio

PowerChain 1.0.0 provides separate swap/liquidity routing on Solana and Sui while preserving Wormhole NTT as the only bridge principal-movement protocol.

## Execution routing

- Solana swaps use Jupiter Swap V2 order/execute. The server requests the order, the connected Solana wallet signs the returned versioned transaction, and the signed transaction is submitted through the Jupiter execute endpoint.
- Sui swaps use the existing Cetus Aggregator path with the connected Sui wallet as sender, signer and gas payer.
- Raydium API v3, Meteora DLMM Data API and Orca Public API v2 provide direct pool discovery. Jupiter route-plan metadata exposes the actual Solana liquidity venues used for a selected route.
- Raydium Transaction API is available as a direct quote integration boundary for future explicit venue selection. It is not silently substituted for the wallet-selected Jupiter transaction.

## Trusted token list

The server owns the allowlist in `apps/backend/src/data/trusted-token-list.ts`. Browser selectors obtain this list from `GET /api/v1/tokens/trusted`. Arbitrary browser-provided token addresses are rejected by executable swap routes.

Canonical mainnet defaults include SOL/WSOL and Solana USDC. PWRC, wPWRC and Sui USDC are included only when their configured protocol addresses are present.

## Pools and liquidity

`GET /api/v1/pools` normalizes trusted pool discovery across Raydium, Meteora, Orca and Cetus. `GET /api/v1/liquidity/status` reports provider-level discovery readiness. `GET /api/v1/liquidity/positions` provides a wallet-oriented Solana LP summary using current provider read APIs where available.

Pool observations are written to five-minute `DexPoolSnapshot` buckets when the database is configured. Persistence is analytics-only and never blocks a live routing request.

## Portfolio

`GET /api/v1/portfolio` reads connected-wallet balances for the trusted token set. Solana reads native SOL plus SPL/Token-2022 token accounts through configured RPC failover. Sui balances use the existing gRPC client/fallback layer.

The browser `usePortfolio` hook and Assets workspace consume this endpoint. Portfolio values are wallet UX data and are not bridge reconciliation evidence.

## Database

Migration `20260816000200_dex_liquidity` adds:

- `dex_pool_snapshots`
- `swap_route_snapshots`
- `liquidity_positions`
- `DexChain`
- `DexProvider`

Swap route snapshots are best-effort analytics. A database analytics failure never authorizes or completes a transaction.

## Server configuration

```env
JUPITER_API_KEY=
POWERCHAIN_JUPITER_API_URL=https://api.jup.ag/swap/v2
POWERCHAIN_RAYDIUM_API_URL=https://api-v3.raydium.io
POWERCHAIN_RAYDIUM_TRANSACTION_API_URL=https://transaction-v1.raydium.io
POWERCHAIN_RAYDIUM_OWNER_API_URL=https://owner-v1.raydium.io
POWERCHAIN_METEORA_API_URL=https://dlmm.datapi.meteora.ag
POWERCHAIN_ORCA_API_URL=https://api.orca.so/v2/solana
POWERCHAIN_SOLANA_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
POWERCHAIN_SUI_USDC_COIN_TYPE=
```

Jupiter credentials are server-only. Provider API URLs may be overridden without exposing API keys in `NEXT_PUBLIC_*` variables.

## Safety invariants

- Connected wallet remains payer and signer.
- The server never receives a wallet private key.
- Solana Jupiter transactions are unsigned when returned to the client.
- Trusted-token validation occurs server-side.
- DEX pool/portfolio metrics are not authoritative for bridge accounting.
- Wormhole NTT remains the sole cross-chain principal-movement protocol.
