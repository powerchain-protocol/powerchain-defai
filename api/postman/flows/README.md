# PowerChain | DeFAI Postman Flows

The checked-in flow artifacts are executable **Collection Runner companions** generated from the canonical API action registry. The detailed visual canvas design lives in [../../../docs/POSTMAN_FLOWS_ARCHITECTURE.md](../../../docs/POSTMAN_FLOWS_ARCHITECTURE.md).

Included flows:

1. Platform Preflight
2. Sui Swap Review
3. Solana Swap Review
4. Bridge Create & Monitor

The generated requests use real Start-input mappings and production-shaped request bodies. Quote/order responses capture the values needed by later requests. Wallet signatures still happen outside Postman.

`PowerChain-DeFAI.flows.json` is the declarative architecture manifest, including visual block types and typed inputs. `PowerChain-DeFAI.flows.postman_collection.json` is the importable Collection Runner companion. It is intentionally not presented as a native Postman Flows canvas export.

Bridge monitoring uses the API's canonical statuses. The visual Flow may add a Delay block between status checks; the checked-in Runner companion remains bounded rather than creating an unbounded polling loop.
