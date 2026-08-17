# @powerchain/staking

`@powerchain/staking` owns the deployment-gated PWRC/wPWRC staking contract between the web application, runtime verification, and the on-chain staking implementation.

Staking remains **fail-closed** until verified Solana/Sui deployment identifiers and reward sources are available. The package now consumes the shared `@powerchain/blockchain` and `@powerchain/runtime` contracts directly, with `@solana/kit` 7.1.0 and `@mysten/sui` 2.26.1 aligned to the application runtime. The package must not fabricate APR, reward rates, pool state, or deployment availability. The connected wallet remains the signing authority for staking actions.

## What this package guarantees

- staking stays fail-closed until deployment identifiers and reward sources are verified;
- canonical Solana PWRC and Token-2022 identifiers are pinned from PowerChain protocol configuration;
- the preserved reward model is a fixed pool capped at **the deployment-configured funded reward cap**;
- live reward rate and funded/distributed balances come from verified on-chain state;
- APR is not fabricated or hard-coded;
- the connected wallet remains the signing authority;
- backend custody and backend user signing are forbidden;
- Sui staking remains non-executable until its package/pool/reward objects have a real runtime verifier.

## Public modules

| Export | Responsibility |
| --- | --- |
| `@powerchain/staking` | Complete staking API |
| `@powerchain/staking/config` | Canonical staking policy, environment names, and deployment-verified reward-cap policy |
| `@powerchain/staking/types/staking` | Staking configuration, verification, reward-source, pool-metric, and wallet-position types |
| `@powerchain/staking/verification` | Solana RPC deployment/reward verification and Sui fail-closed boundary |
| `@powerchain/staking/services/staking` | Aggregated asynchronous staking status |

`stakingStatus()` is asynchronous because a configured Solana deployment is not marked executable until its RPC evidence is checked. The `/staking` page uses that verified configuration to gate wallet-signed Solana actions (initialize position, stake, request unstake, withdraw, and claim) and to render the light-first/dark-capable staking dashboard. The companion read-only position endpoint validates the connected wallet position PDA before displaying active stake, pending unstake, recorded rewards, and cooldown readiness. Every action re-checks `/api/v1/staking/status` immediately before transaction construction/submission. Deployment readiness never authorizes backend signing, and Sui staking remains read-only/fail-closed until a Sui runtime verifier is implemented.

The browser also refreshes runtime verification while the staking workspace is visible/online, aborts superseded status/position requests, validates stake/unstake amounts against verified minimum/balance/position limits, and treats post-signature confirmation failures as ambiguous submissions. A returned signature is never discarded or presented as a clean failure that is safe to blindly retry.

See [`../../docs/STAKING.md`](../../docs/STAKING.md) and [`../../docs/DEFAI_ARCHITECTURE.md`](../../docs/DEFAI_ARCHITECTURE.md).

## Token-2022 accounting

PWRC staking records the actual amount credited to program vaults after Token-2022 extension processing. Native transfer fees are not hidden or fabricated: deposit/funding events expose both requested and credited amounts, and withdrawals/claims expose both vault debit and recipient credit.

### Staking transaction recovery

Wallet-submitted staking signatures are stored locally for recovery, synchronized across browser tabs, and reconciled through the read-only staking transaction status API. `submitted`, `processed`, `confirmed`, `finalized`, and `failed` states are shown without automatically resubmitting an instruction. Ambiguous transactions must be verified before the user chooses to retry. This journal is client-local operational UX and is not authoritative reward, bridge, or accounting state.
