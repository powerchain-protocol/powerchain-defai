# Integration architecture

PowerChain Bridge 1.0.0 separates execution, observation, metadata, payments, and bridge settlement so an external data provider cannot accidentally become an accounting authority.

## Execution providers

- Solana swaps: Jupiter Swap V2 order, wallet signature, execute.
- Sui swaps: Cetus Aggregator with the connected wallet as sender and gas payer.
- Cross-chain PWRC/wPWRC principal: Wormhole NTT only.

Raydium, Meteora, and Orca are normalized as Solana pool-observation sources. They can appear in Jupiter route metadata, but the browser does not switch signing authority to a provider.

## Data and metadata

- Helius: Solana RPC and DAS metadata.
- Metaplex: canonical Token Metadata program/PDA derivation.
- Birdeye: keyed market-data adapter.
- DEX Screener: public pair/token market observations.
- CoinMarketCap: keyed off-chain market quotes.
- Tensor: opt-in Solana NFT marketplace adapter, disabled until an API URL and key are configured.

Market data is cached briefly and rate limited. It is always marked non-authoritative for bridge accounting.

## Icons and brand assets

PowerChain, PWRC, and wPWRC use the bundled project artwork. SOL, SUI, and USDC use branded Web3 Icons in the React UI. `cryptoicons.cc` is available only through `NEXT_PUBLIC_CRYPTOICONS_CC_URL_TEMPLATE`; no undocumented public API is assumed.

## Payments

Solana Pay URL construction is implemented server-side. Stripe, MoonPay, and Coinbase Pay are fail-closed configuration boundaries: readiness is visible, but no provider is silently enabled without credentials and an explicit enable flag.

## API contracts

The machine-readable OpenAPI document is available at `/api/v1/openapi`. The checked-in `api/swagger.yaml` gives release tooling a stable contract source, and `shared/actions.json` mirrors the generated action registry.
