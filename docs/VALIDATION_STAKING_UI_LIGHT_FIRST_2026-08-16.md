# Staking UI light-first upgrade validation — 2026-08-16

## Scope

This pass upgrades the PowerChain staking experience from a deployment card into a responsive staking workspace while keeping the existing runtime-verification and wallet-signing safety model.

## UI

- Light theme remains the default through the shared PowerChain theme provider.
- Dark theme adds the low-glow forest/onyx staking treatment inspired by the supplied reference without introducing a separate theme system.
- Hero, verified KPI strip, wallet position, staking actions, reward policy, deployment verification, runtime parameters, benefits and workflow sections are responsive.
- Promotional reference values such as APY, validator rankings, uptime, USD rewards and projected annual earnings are not copied into the product.

## Runtime data

The staking dashboard uses only verified or wallet-derived values:

- total staked and minimum stake from decoded on-chain staking config;
- cooldown slots from decoded on-chain staking config;
- reward funding/availability and ppm/epoch policy from verified reward-vault/config evidence;
- Token-2022 wallet balance from the connected wallet ATA;
- wallet position PDA state from the read-only staking position endpoint.

`GET /api/v1/staking/position?wallet=<SOLANA_ADDRESS>` validates PDA derivation, program ownership, Anchor account discriminator, embedded wallet owner, current slot and cooldown readiness. It never signs or mutates state.

## Actions

Initialize position, stake, request unstake, withdraw and claim remain connected-wallet signed. Every action revalidates `/api/v1/staking/status` immediately before transaction construction so stale deployment identifiers cannot silently authorize a transaction.

## Validation

Dependency-independent validation passed:

- 62/62 `scripts/*production-check.mjs` gates;
- 555 TypeScript/TSX files through the repository parser gate;
- 85 API route files / 86 generated actions / 14 redirects;
- Postman 86 actions / 4 flows / 10 mocks;
- separated Bridge 11-path and Swap 7-path contracts;
- 81 Markdown files.

A dependency-backed semantic TypeScript/Next build still requires the real installed Node 24 / pnpm 11.22.0 workspace because the extracted artifact in this runner does not include installed workspace declarations such as `@types/node`.
