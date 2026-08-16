# Workspace

PowerChain Bridge is a pnpm 11.22.0 workspace. The root `pnpm-workspace.yaml` is the canonical project-level pnpm configuration; `.npmrc` contains registry/auth-compatible settings only.

## Layout

- `apps/bridge` — Next.js web/API application (`.next` output)
- `apps/backend` — server-only domain/services package
- `apps/worker-claims` — claim settlement worker
- `apps/worker-fees` — fee settlement/reconciliation worker
- `packages/database` — Prisma/PostgreSQL package
- `packages/runtime` — shared runtime/worker primitives

First-party dependencies use `workspace:*`. Workspace packages are linked and preferred locally. A single root lockfile is expected once dependencies are installed.

`injectWorkspacePackages` is intentionally not enabled: these packages export live TypeScript source, and hardlink injection can lag source changes during development. Normal workspace symlinking is the canonical mode.

## Commands

```bash
pnpm workspace:config:check
pnpm workspace:production:check
pnpm check:fast
pnpm install:update     # intentionally refresh the lockfile
pnpm install:ci         # CI/reproducible install after pnpm-lock.yaml exists
pnpm build:production
```

Production/CI should commit `pnpm-lock.yaml` and use `pnpm install:ci`. Vercel can switch from `--no-frozen-lockfile` to `--frozen-lockfile` after the lockfile is generated with pnpm 11.22.0.
