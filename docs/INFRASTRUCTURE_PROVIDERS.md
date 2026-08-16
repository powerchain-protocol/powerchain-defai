# Infrastructure providers

## Solana / Helius

PowerChain Bridge accepts explicit primary and fallback Solana HTTP/WebSocket endpoints. When explicit primary endpoints are absent and `HELIUS_API_KEY` is configured, the server derives Helius RPC and LaserStream WebSocket endpoints. API keys remain server-only. Production readiness still requires an independent fallback provider host.

## Sui

Blocking Sui bridge reads use the Mysten `SuiGrpcClient` through ordered `POWERCHAIN_SUI_GRPC_*` endpoints. Provider health probes every configured gRPC endpoint independently; full redundancy is reported only when at least two endpoints actually respond. A configured URL alone is not treated as healthy. Legacy JSON-RPC settings are compatibility fallbacks only where explicitly documented.

## Cetus

Cetus is an optional Sui liquidity/market integration. `POWERCHAIN_CETUS_API_URL`, `POWERCHAIN_CETUS_PACKAGE_ID`, and `NEXT_PUBLIC_CETUS_ENABLED` control availability. Cetus data may assist routing or market context but cannot mark a cross-chain transfer complete and cannot replace Wormhole NTT finality/reconciliation evidence.

## Wormhole NTT

Wormhole NTT remains the sole cross-chain principal movement protocol. PowerChain auxiliary contracts, Helius, Cetus, explorers, and realtime transports are supporting infrastructure only.
