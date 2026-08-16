# PowerChain Swap API

Swap-only contract package for wallet-owned same-chain execution on Solana and Sui.

- Runtime namespace: `/api/v1/swap/*`
- Runtime OpenAPI: `/api/v1/swap/openapi`
- Checked-in contract: `api/swap/openapi.yaml`
- Generated Postman collection: `api/swap/postman/`

Solana execution uses Jupiter order/execute with connected-wallet signing. Sui execution uses Cetus with connected-wallet signing. Swap may observe Raydium, Meteora, Orca, and Cetus liquidity, but it cannot finalize or reconcile Bridge transfers.

Shared API-key security, currencies, RPC, clusters, wallet validation, and trusted-token primitives are common infrastructure.

## Combined API documentation

See [`../postman/API_DOCS.md`](../postman/API_DOCS.md) for the **PowerChain | DeFAI API Docs** covering authentication, production domains, shared services, and the complete API inventory. This Swap contract remains domain-specific.
