# Cross-chain blockchain and cluster foundation

PowerChain DeFAI supports Solana and Sui through two canonical workspace packages:

- `/clusters` (`@powerchain/clusters`) owns supported network/cluster definitions.
- `/shared/blockchain` (`@powerchain/blockchain`) owns chain types, address normalization, Sui coin-type normalization, and Solana↔Sui direction rules.

Application features should consume these packages instead of redefining `SOLANA | SUI`, network names, or address parsers locally.

## Supported clusters

Solana supports `mainnet-beta`, `testnet`, `devnet`, and `localnet`. Sui supports `mainnet`, `testnet`, `devnet`, and `localnet`. Mainnet remains the default for both chains.

The cluster registry does not provide secret RPC URLs. Runtime RPC/gRPC URLs remain server-side configuration owned by `apps/backend/src/services/rpc.ts` and the endpoint-pool configuration.

## Cross-chain routes

The shared blockchain package permits only two PowerChain cross-chain directions:

- `SUI_TO_SOLANA`
- `SOLANA_TO_SUI`

Same-chain operations are Swap/liquidity concerns and are not represented as Bridge directions.

Wormhole NTT remains the only protocol allowed to move PWRC/wPWRC principal between Solana and Sui. Cluster metadata, explorers, RPC providers, DEXs, AI responses, portfolio data, and market-data services remain non-authoritative for bridge accounting.

## Address validation

Solana account strings are base58-decoded and must resolve to 32 bytes. Sui addresses are normalized to lowercase 32-byte hex form. Sui coin types must contain a valid address plus module and struct identifiers.

Connected-wallet payer checks, bridge quote addresses, and new cross-chain services should use the shared normalizers instead of chain-specific ad hoc parsing.

## Public APIs

`GET /api/v1/blockchains` returns the active Solana and Sui runtime network contexts without RPC URLs or credentials.

`GET /api/v1/clusters` returns the supported cluster registry plus the two allowed cross-chain pairs. It explicitly reports `wormhole-ntt` as the principal-movement protocol and remains non-authoritative for settlement.
