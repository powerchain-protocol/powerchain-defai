# Environment, providers, features, and runtime policy

PowerChain DeFAI keeps provider credentials server-side and normalizes legacy or provider-specific names through typed backend configuration.

## Solana programs

The Token, Token-2022, and Associated Token program IDs are public protocol constants. `apps/backend/src/config/solana-programs.ts` verifies configured values match the canonical IDs before exposing them through the public cluster registry.

## Jupiter and Raydium

`POWERCHAIN_JUPITER_API_URL` remains the canonical Solana execution endpoint for the current Jupiter Swap V2 order/execute flow. `JUPITER_API_URL`, `JUPITER_SWAP_API`, `JUPITER_PRICE_API`, and `JUPITER_TOKEN_LIST` are compatibility/data settings only and do not replace the wallet-signed Swap V2 execution path.

`RAYDIUM_API` is accepted as an alias for the canonical Raydium API v3 read endpoint.

## Market data

Birdeye, CoinGecko, CoinMarketCap, and DEX Screener are observational market-data sources. Their values are never Bridge settlement evidence. CoinGecko can use the Pro API when `COINGECKO_API_KEY` is configured and otherwise uses the public API boundary.

## Pyth

`POWERCHAIN_PYTH_HERMES_URL` remains canonical. `PYTH_HERMES_URL` and `PYTH_PRICE_SERVICE` are compatibility aliases. Pyth API authentication remains server-side.

## Sui

`POWERCHAIN_SUI_NETWORK` and the gRPC endpoint pool remain canonical. `SUI_NETWORK` and `SUI_RPC` are compatibility aliases. Critical Sui reads continue through the Sui gRPC Core API; `SUI_WS` is retained for configuration compatibility and is not promoted to a critical JSON-RPC/WebSocket settlement path.

## Cross-chain providers

`WORMHOLE_ENABLED` gates the PWRC/wPWRC Bridge because Wormhole NTT remains the sole principal movement protocol. `CCTP_ENABLED` is scoped to supported stablecoin movement only. `LAYERZERO_ENABLED` does not create a PWRC Bridge route. `BRIDGE_OPERATOR_KEY` is never accepted as the connected user's wallet signer.

## AI

`ENABLE_AI` gates the assistant. PowerChain can use a configured custom provider or supported server-side OpenAI-compatible, Anthropic, Google, DeepSeek, or OpenRouter credentials. AI output remains advisory and cannot sign or finalize transactions.

## Cache and realtime

Cache TTL variables are bounded before use. WebSocket/reconnect settings are exposed as runtime policy, while transport fallback remains WebSocket → SSE → polling for Bridge status.

## Secrets

Never commit production API keys. `.env.example`, `.env.local.example`, and `.env.production.example` contain placeholders only. API authentication uses `POWERCHAIN_API_KEYS`; `SWAGGER_API_KEY` is accepted only as a server-side compatibility alias for `X-Api-Key` authorization.
