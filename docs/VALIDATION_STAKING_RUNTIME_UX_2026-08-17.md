# Staking runtime UX validation — 2026-08-17

Version: `1.0.0`

This pass hardens the light-first staking workspace without introducing synthetic yield, validator, reward, pool, or deployment claims.

## Runtime changes

- server-verified staking status hydrates the client workspace;
- client refresh is timeout-bounded, abort-safe, focus/online aware, and does not replace fail-closed transaction-time verification;
- wallet balance distinguishes a missing Token-2022 ATA from an RPC failure;
- stake/unstake inputs validate against the verified minimum stake, wallet balance, and active stake before wallet invocation;
- 25/50/75/Max shortcuts use integer base-unit arithmetic;
- staking submissions are single-flight;
- a returned signature followed by inconclusive confirmation is preserved as an ambiguous submission and must be verified before retry;
- successful and ambiguous submissions refresh wallet-position and runtime evidence.

## Safety invariants

- connected wallet remains the only user signing authority;
- backend remains read-only for wallet-position inspection and deployment verification;
- every state-changing action refreshes deployment identity immediately before building the transaction;
- no APR/APY or projected reward amount is generated;
- no RPC failure is represented as a zero balance;
- no ambiguous submitted transaction is represented as a clean retry-safe failure.

## Source-level validation

Run:

```bash
pnpm staking:production:check
pnpm staking-ui:production:check
pnpm staking-runtime-ux:production:check
pnpm syntax:check
pnpm verify:production
```

Dependency-backed Next.js/React typechecking and wallet/RPC E2E execution still require the actual Node 24 + pnpm 11.22.0 checkout with installed dependencies.

## Executed source-level results

- direct `scripts/*production-check.mjs`: **63/63 passed**;
- TypeScript/TSX parser gate: **556 files passed**;
- Markdown structure: **83 files passed**;
- route contract: **85 API route files / 86 actions / 14 redirects**;
- Postman: **86 actions / 4 flows / 10 mock examples**;
- separated API contracts: **Bridge 11 paths / Swap 7 paths**;
- build manifest: **229 SHA-256-bound artifacts**.
