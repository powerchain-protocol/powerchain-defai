# Real NTT bridge validation

## Implemented production path

- The broad Wormhole Connect browser dependency is removed to avoid unsupported/deprecated chain packages in this Solana/Sui-only app. PowerChain owns quote binding and transfer tracking; wallet-signed NTT execution may be opened through the reviewed `NEXT_PUBLIC_POWERCHAIN_NTT_TRANSFER_URL` surface, then the source signature/digest is bound to the persisted transfer.
- Persisted server quote and transfer records bind principal, route, wallets, runtime snapshot, service fee and intent commitment.
- Source transaction hashes are unique to a PowerChain transfer and may be attached idempotently after wallet submission.
- The bridge worker independently checks source-chain finality and success, the expected NTT manager, source signer, and source PWRC/wPWRC principal debit.
- Wormholescan NTT operations are correlated by the configured source emitter and exact source transaction, then validated for emitter chain, source/destination chain, source/destination address and normalized principal amount.
- The bridge worker independently checks the Executor destination transaction on the destination RPC and validates the recipient's principal credit and expected NTT manager invocation.
- Completion requires verified or waived service-fee settlement and a fresh final reconciliation against the same NTT operation and destination transaction.
- Evidence mismatches move to `RECONCILIATION_REQUIRED`; blockchain writes are never blindly retried by the bridge worker.

## Static gates run in the artifact environment

- `real-bridge:production:check` — PASS
- migration byte parity — PASS (7 migrations)
- full production source gate — PASS
- type-hygiene production check — PASS
- TypeScript syntax parse — PASS (252 files, 0 syntax errors)
- bridge-core production check — PASS
- runtime wiring check — PASS
- failure-safety production check — PASS
- platform production check — PASS
- operations production check — PASS
- environment contract — PASS (76 canonical keys)
- workspace configuration — PASS

Dependency-aware `pnpm install`, Prisma generation, TypeScript semantic typecheck, and `next build` still require an environment that can install the pinned dependency graph.
