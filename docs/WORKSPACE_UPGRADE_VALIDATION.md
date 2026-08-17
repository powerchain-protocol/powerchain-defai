# Workspace Upgrade Validation

PowerChain Bridge release: `1.0.0`
Package manager: `pnpm@11.22.0`

## Implemented

- Canonical `apps/*` + `packages/*` workspace layout.
- `linkWorkspacePackages: true` and `preferWorkspacePackages: true`.
- `saveWorkspaceProtocol: true` and `sharedWorkspaceLockfile: true`.
- Strict engine, peer, store integrity, dependency-build, cycle, and filter checks.
- Workspace dependency validation requires first-party `@powerchain/*` dependencies to use `workspace:`.
- Fast workspace/source validation scripts.
- Vercel build uses `pnpm build:production`.
- Next.js output remains `apps/bridge/.next`.
- Release/package version remains exactly `1.0.0`.

## Validation performed in this environment

- `workspace-production-check.mjs`: PASS
- `workspace-config-check.mjs`: PASS
- `typescript-syntax-check.mjs`: PASS (239 TS/TSX files)
- `full-production-check.mjs`: PASS
- `env-check.mjs`: PASS (60 canonical keys)
- `check-migrations.mjs`: PASS (5 mirrored migrations)

## Dependency-aware limitation

`source ./bootstrap.sh` was attempted but this execution environment could not download the pnpm tarball from `registry.npmjs.org`. Therefore dependency installation, Prisma generation and the real Next production build are not marked as executed here.
