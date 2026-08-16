# PowerChain Bridge API

Bridge-only contract package for PWRC/wPWRC Wormhole NTT workflows.

- Runtime namespace: `/api/v1/bridge/*`
- Runtime OpenAPI: `/api/v1/bridge/openapi`
- Checked-in contract: `api/bridge/openapi.yaml`
- Generated Postman collection: `api/bridge/postman/`

Bridge owns quote, transfer, source-attachment, history, event, route, runtime, and configuration operations. It does not own same-chain DEX execution.

Shared API-key security, currencies, RPC, clusters, wallet validation, and trusted-token primitives are common infrastructure. **Wormhole NTT remains the sole cross-chain PWRC/wPWRC principal mover.**

## Combined API documentation

See [`../postman/API_DOCS.md`](../postman/API_DOCS.md) for the **PowerChain | DeFAI API Docs** covering authentication, production domains, shared services, and the complete API inventory. This Bridge contract remains domain-specific.
