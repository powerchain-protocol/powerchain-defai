# PowerChain DeFAI 1.0.0 — consistency and install hardening

## Improvements

- Corrected canonical PWRC expected supply to `18,446,000,000,000,000,000` base units at 9 decimals.
- Added a canonical token-policy production gate covering mint, decimals, supply, service-fee separation, and the no-`TransferFeeConfig` invariant.
- Removed the contradictory 250 bps native PWRC Token-2022 fee policy. Canonical PWRC native transfer fee is 0 bps; governed PowerChain service fees remain separate from bridge principal and gas.
- Converted the legacy withheld-fee helper to fail closed for canonical PWRC.
- Updated the bridge fee UI/API to report canonical Token-2022 policy compliance instead of advertising a native 2.5% fee.
- Made Prisma 7 client generation independent of `DATABASE_URL`, matching Prisma's supported generate workflow.
- Root postinstall resolves and invokes the installed Prisma CLI directly; it no longer skips client generation only because a database URL is absent.
- Build, production build, typecheck, and start checks no longer create root `.env` files as a side effect. Local dev bootstrap remains explicit through `predev` / `pnpm env:bootstrap`.
- Workspace bootstrap verifies that no dependency lifecycle builds remain ignored after installation.

## Source-level validation

- 57/57 direct `scripts/*production-check.mjs` gates passed.
- TypeScript syntax gate: 550 TS/TSX files passed.
- Markdown structure: 78 files passed.
- API route contract: 84 route files / 85 actions / 14 redirects passed.
- Postman artifacts: 85 actions / 4 flows / 10 mock examples current.
- Build manifest: 188 artifacts current.

## Runtime boundary

This execution environment does not contain the user's installed pnpm/Next/Prisma/Anchor/Cargo dependency state, so this report does not claim a real dependency-backed `pnpm install`, Next build, database migration, or Anchor build. Those must run in the actual Node 24 / pnpm 11.22.0 checkout.
