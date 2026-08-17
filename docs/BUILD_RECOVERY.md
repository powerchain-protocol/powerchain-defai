# Build recovery

Use pnpm for project dependency and workspace operations. Node must satisfy `>=24 <26` before workspace repair can run.

From the repository root:

```bash
source ./bootstrap.sh
pnpm workspace:repair
pnpm workspace:install:check
```

The repository pins Node `24.19.0` in `.nvmrc` and `.node-version`, but nvm is not required. `source ./bootstrap.sh` can install the verified pinned runtime user-locally; the Dev Container remains the preferred reproducible path.

`postinstall` delegates to the canonical `prisma:ensure` path and does not require a live `DATABASE_URL`. `pnpm workspace:repair` is for failed, partial, stale, or branch-switched installs: it removes stale workspace modules and lockfile state, performs a fresh pnpm resolution, applies the reviewed dependency-build policy, regenerates Prisma from the current schema/config, and validates the schema. It does not run database migrations.

Then run:

```bash
pnpm env:check
pnpm db:check:migrations
pnpm typecheck
pnpm test:protocol
pnpm build:production
```

## Development stack preflight

`pnpm dev:stack` is the database-backed development topology. Before worker fan-out, the root lifecycle validates the workspace install, bootstraps missing development env files, verifies Prisma Client, and checks PostgreSQL reachability.

Use `pnpm dev` when only the Next.js app/API shell is needed.

## Workspace doctor

After a clean pnpm install:

```bash
pnpm doctor
```

The doctor checks Node/pnpm versions, mixed package-manager artifacts, missing workspace links, generated Prisma Client, environment templates, and TypeScript configuration.

## Ignored build-script recovery

PowerChain source-controls the reviewed dependency build set in `pnpm-workspace.yaml`.

```bash
pnpm deps:builds:approve:reviewed
pnpm install
pnpm deps:builds:check
```

Do not enable an unrestricted dependency-build policy. New packages must be reviewed before entering the checked-in allowlist.

## Missing hidden runtime files

If a copied checkout omitted `.nvmrc` or `.node-version`:

```bash
source ./bootstrap.sh
```

The bootstrap recreates both marker files, accepts the pinned runtime when already active, and otherwise installs the verified pinned Node binary and pnpm user-locally.

See [`../README.md`](../README.md) for the complete recovery sequence.
