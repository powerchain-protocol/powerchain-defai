# PowerChain DeFAI 1.0.0 — fully wired follow-up validation

## Scope

This follow-up closes the Codespaces setup loop and wires verified Solana staking to the connected-wallet transaction path.

## Fixed setup/install regressions

- `verifyDepsBeforeRun: warn` prevents `pnpm run` / `pnpm exec` from auto-starting `pnpm install` before repair/bootstrap commands can run.
- `allowBuilds` remains strict and source-controlled; unreviewed dependency lifecycle scripts still fail installation.
- `pnpm deps:builds:approve:reviewed` deterministically approves only the reviewed dependency build set and rebuilds already-installed ignored packages when possible.
- `pnpm workspace:bootstrap` runs repository-root env bootstrap, reviewed build approval, installation, Prisma generation and Prisma validation. It does not run migrations.
- Root `.nvmrc`, `.node-version`, `.env.example`, `.env.local.example`, `.npmrc`, `.vercelignore`, `vercel.json`, and `pnpm-workspace.yaml` are explicitly included in the new overlay artifact.

## Fully wired Solana staking

The `/staking` page now enables wallet-owned actions only when the server-side staking verifier reports the Solana deployment executable and unpaused.

Implemented connected-wallet actions:

1. initialize stake position PDA;
2. stake canonical PWRC Token-2022;
3. request unstake;
4. withdraw unlocked principal;
5. claim funded rewards.

Before every transaction the client re-fetches `/api/v1/staking/status` and requires the program, config, stake vault, reward vault, mint and Token-2022 program identifiers to exactly match the server-rendered verified configuration. Any deployment drift, pause, missing identifier or failed readiness check blocks transaction creation.

The backend and AI assistant never receive signing authority. Sui staking remains fail-closed until a real package, pool, reward source and runtime verifier exist.

## Source-level validation executed

- Direct Node production gates: **51/51 PASS**.
- TypeScript/TSX syntax gate: **550 files PASS**.
- Workspace configuration: **PASS**.
- Node/NVM release tooling: **PASS**.
- React/type-resolution boundary: **PASS**.
- exact optional property/type boundary: **PASS**.
- provider hooks/runtime boundary: **PASS**.
- staking production gate: **PASS**.
- escrow production gate: **PASS**.
- Markdown structure: **77 files PASS** before this report was added; rerun after packaging remains required by the manifest step.
- Route contract: **84 API route files / 85 actions / 14 redirects PASS**.
- Postman collection: **85 actions PASS**.
- Postman specs/flows/mocks: **85 actions / 4 flows / 10 mock examples PASS**.
- separated API contracts: **Bridge 11 / Swap 7 PASS**.

## Dependency-backed boundary

This execution container does not have the user's installed pnpm 11.22.0 workspace or the committed Codespaces lockfile/node_modules graph, so it does not claim an actual `pnpm install`, Next production build, Prisma engine execution, or Anchor/Cargo build here. The user's Codespaces log proves Node 24.14.0 and pnpm 11.22.0 are available in the target checkout; after applying this overlay, use the bootstrap sequence below in that checkout.

```bash
source ./bootstrap.sh
pnpm workspace:bootstrap
pnpm db:migrate:deploy
pnpm validate:all
pnpm dev
```

For a workspace that already has ignored build artifacts:

```bash
pnpm deps:builds:approve:reviewed
pnpm install
pnpm prisma:generate
pnpm prisma:validate
```
