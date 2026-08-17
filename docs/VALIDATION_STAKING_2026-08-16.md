# Staking and Monorepo Validation — 2026-08-16

This validation pass covers the PowerChain DeFAI 1.0.0 source tree after the staking program, runtime verification, strict TypeScript, and monorepo reliability upgrades.

## Completed source-level validation

The following checks passed in the supplied source tree:

- all 52 dependency-independent `scripts/*production-check.mjs` gates;
- React/TypeScript type-resolution production gate;
- TypeScript syntax validation across 532 TypeScript/TSX files;
- semantic `tsc --noEmit` for `@powerchain/staking` under `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`;
- workspace configuration across all 18 workspace package manifests;
- relative source-import resolution;
- route contract validation: 82 API route files / 83 actions / 14 redirects;
- combined Postman generation parity: 83 actions;
- Postman specs/flows/mocks parity: 83 actions / 4 flows / 10 mock examples;
- separated API contracts: Bridge 11 actions / Swap 7 actions;
- Markdown structure validation;
- protocol layout test;
- staking source invariant test.

## Staking validation

The staking implementation now enforces these source and runtime boundaries:

- canonical PWRC mint is repository-pinned;
- the Solana Token-2022 program is pinned and required by the Anchor account constraints;
- staking deployment identifiers remain `UNSET` until a real deployment exists;
- the compile-time `Stake111...` program ID is rejected by runtime verification;
- Solana program/config/stake-vault/reward-vault identifiers must be RPC verified;
- the Anchor `StakingConfig` discriminator is verified before decoding;
- stake and reward vaults must be Token-2022 accounts for canonical PWRC;
- the fixed reward allocation cap is no longer fabricated in source and must be read from verified deployed configuration;
- reward funded/distributed/account balance invariants are verified;
- reward rate is read as integer ppm per epoch from on-chain config and is range checked;
- APR is not part of the staking status type and is not fabricated;
- the staking program has no reward mint or burn path;
- connected wallets remain the user signing authority;
- Sui staking stays non-executable until a real package/pool/reward-pool/coin-type verifier is implemented.

## Environment boundary

A dependency-backed full Next.js/Prisma build and Anchor/Cargo build could not be executed in this runner because it provides Node 22.16.0 rather than the repository-required Node 24.x, does not provide pnpm 11.22.0 or the Rust/Anchor/Solana toolchain, and cannot install the missing workspace dependency graph from the public registry.

This report therefore does **not** claim a dependency-backed `pnpm build`, `pnpm dev`, `anchor build`, or live RPC deployment test. Run the following in the normal PowerChain Node 24 / pnpm 11.22 / Anchor environment before promotion:

```bash
source ./bootstrap.sh
source ./bootstrap.sh
pnpm install
pnpm doctor
pnpm typecheck
pnpm verify:production
pnpm build
cd programs/solana
anchor build
anchor test
```

If `pnpm-lock.yaml` is absent in a fresh checkout, generate it with the first reviewed `pnpm install`, then commit it before using `pnpm install --frozen-lockfile` in CI.
