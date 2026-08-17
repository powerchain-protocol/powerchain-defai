# PowerChain DeFAI monorepo validation — 2026-08-16

Version: `1.0.0`

## Scope

This upgrade was prepared from the supplied `powerchain-defai-1.0.0-hooks-types-websocket-resilience-upgrade` archive. The live `/workspaces/powerchain-defai` checkout was not mounted, so the deliverable is a merge-ready overlay plus an upgraded source archive rather than a claim that the user's local checkout was edited in place.

The pass covers provider hooks and exact-optional typing, typed provider boundaries, realtime fallback behavior, pnpm/workspace/environment reliability, Next.js wallet SSR safety, Solana/Sui wallet providers, optional Reown WalletConnect, deployment-gated staking, Solana Pay checkout planning, and a receipt-based Solana escrow program.

## Verified source-level results

- Production source gates: **55 / 55 PASS**.
- TypeScript parser/syntax gate: **549 TS/TSX files PASS** with the available TypeScript 5.8.3 parser.
- React/type-resolution source gate: **PASS**.
- `exactOptionalPropertyTypes` production gate: **PASS**.
- Workspace configuration: **18 workspace manifests + root = 19 projects**, canonical `workspace:*` first-party dependencies, requested pnpm integrity settings: **PASS**.
- Route contract: **84 API route files / 85 actions / 14 redirects PASS**.
- Generated Postman artifacts: **85 actions / 4 flows / 10 mocks PASS**.
- Split API contracts: **Bridge 11 paths / Swap 7 paths PASS**.
- Protocol layout test: **PASS**.
- Solana source-level program tests: Bridge, Staking, and Escrow: **PASS** under Node type stripping.
- Markdown structure and relative documentation hygiene: **PASS** after normalization.
- `pnpm env:bootstrap` path resolution: **PASS when invoked from `apps/bridge`**; root `.env` and `.env.local` were created from templates and then removed from the release tree.
- Postinstall without `DATABASE_URL`: **PASS / skips Prisma generation cleanly**.

## Provider hooks and realtime

`useProviderHealth()` and `useProviderReadiness()` accept zero arguments. Both use bounded refresh intervals, generation guards, AbortController cancellation, online/visibility handling, freshness calculations, and fail-closed error state.

Provider HTTP paths are centralized in `apps/bridge/backend/endpoints.ts`; runtime requests use the typed `providerClient`, bounded timeout handling, and runtime payload validators. The operation journal builds `clear` messages by omitting absent `id`/`revision` properties rather than assigning `undefined`, preserving `exactOptionalPropertyTypes` correctness.

Transfer observation preserves WebSocket → SSE → polling fallback. Reconnect behavior is bounded with backoff/heartbeat/message-rate protections, and malformed or unavailable realtime data never synthesizes blockchain completion.

## Wallet SSR fix

The previous `/chat` failure was caused by Mysten dApp Kit wallet code entering the Next.js server evaluation path. The upgraded architecture keeps the global Solana wallet provider free of Mysten imports. Sui state is exposed through an app-owned `SuiWalletStateProvider`, while `sui-wallet-runtime`, `sui-connect-button`, and `sui-swap-island` are dynamically loaded with `ssr: false`.

Solana continues to use Wallet Standard discovery. Reown WalletConnect is optional and is constructed only in a browser effect when `NEXT_PUBLIC_REOWN_PROJECT_ID` is configured. Wallet actions remain non-custodial; no backend seed/private-key/signer path was added.

## Staking deployment gate

`@powerchain/staking` contains the canonical source-pinned PWRC mint and Token-2022 program identity, but it does **not** claim a live staking deployment from those values. Solana staking becomes executable only after RPC verification of the executable program, program-owned staking config, canonical Token-2022 stake/reward vaults, deployment-configured reward allocation cap, funded/distributed accounting, reward vault balance, and integer reward-rate/epoch policy.

The reward model is fixed-pool and on-chain configured. No source constant invents the pool size. APR/APY is not calculated or advertised by the package. Sui staking remains fail-closed until package/pool/reward object identities and a real Sui runtime verifier are supplied.

The staking Anchor source uses actual Token-2022 credited/received amounts for accounting, so transfer-fee behavior cannot silently inflate recorded principal or rewards.

## Solana escrow and checkout

`powerchain_escrow` implements receipt PDAs, per-escrow mint allowlisting, slot timelocks, optional Token-2022 extension blocking, and four custom hook points: `PreDeposit`, `PostDeposit`, `PreWithdraw`, and `PostWithdraw`.

If an escrow becomes immutable, its configured hook/extension policy becomes permanent. Any permanent buggy or malicious hook can block future deposits or withdrawals, so deployment verification and hook review are security-critical.

The escrow backend is deliberately non-executable until RPC deployment verification is implemented and passes. The source placeholder program ID is rejected as production deployment evidence. Solana Pay and escrow checkout planning return wallet-owned plans only; the connected wallet signs.

## Toolchain boundary not claimed

A full dependency-backed build was **not executable in this runner** because it has Node.js 22.16.0, no pnpm installation, no Cargo/Anchor toolchain, and registry access required to install the workspace was unavailable. The supplied source archive also did not contain `pnpm-lock.yaml` or `node_modules`.

Therefore this report does **not** claim that the following ran here:

- `pnpm install --frozen-lockfile`;
- dependency-backed `tsc --noEmit` for every workspace;
- `next build` / Next.js dev server startup;
- Prisma client generation against the installed Prisma packages;
- `anchor build`, `anchor test`, or Cargo compilation;
- live Solana/Sui RPC deployment verification or transaction E2E tests.

## Required final verification in the real checkout

Use Node 24.x from `.nvmrc` and pnpm 11.22.0. Because this upgrade changes Next.js and adds the WalletConnect adapter, refresh and commit the real repository lockfile before using frozen installs:

```bash
source ./bootstrap.sh
pnpm env:bootstrap
pnpm install --no-frozen-lockfile
pnpm approve-builds
pnpm prisma:generate
pnpm verify:production
pnpm typecheck
pnpm build
cd programs/solana
anchor build
anchor test
```

After the lockfile is committed, CI/Vercel should use `pnpm install --frozen-lockfile`.

## Bootstrap / ignored-build hardening follow-up

- `verifyDepsBeforeRun: warn` prevents `pnpm env:bootstrap`, `pnpm workspace:bootstrap`, and other repair scripts from recursively invoking `pnpm install` when the existing module graph is stale.
- `scripts/approve-reviewed-builds.mjs` applies only the reviewed `allowBuilds` set and rebuilds previously ignored packages when they are already installed.
- `scripts/bootstrap-workspace.mjs` performs env bootstrap → reviewed build approval → install → Prisma generate/validate; it deliberately does not run migrations.
- Root `.nvmrc`, `.node-version`, `.env.example`, `.env.local.example`, `.vercelignore`, and `vercel.json` are release/overlay-critical files and must be included by the artifact packager.
- Solana staking now has a connected-wallet transaction client for position initialization, stake, unstake request, unlocked withdrawal, and reward claim. Every action performs a fresh `/api/v1/staking/status` identity/readiness check before creating a wallet transaction.
