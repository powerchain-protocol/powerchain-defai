# Local development

PowerChain uses Node 24.19.0 and pnpm 11.22.0. The application shell can run without the worker stack, but the bridge/claims/fees workers require the database-backed runtime.

## One-command full-stack bootstrap

From the repository root:

```bash
bash scripts/dev-stack-bootstrap.sh
```

The script sources the verified user-local toolchain bootstrap internally, so it works when Node 24/25/pnpm are not preinstalled and when hidden runtime marker files were omitted by a copied checkout. It repairs the pnpm workspace, verifies dependencies, initializes environment files, brings up local PostgreSQL when the configured database is localhost, deploys existing Prisma migrations, and starts the stack.

## App/API-only development

```bash
source ./bootstrap.sh
pnpm workspace:repair
pnpm workspace:install:check
pnpm dev
```

This path does not require PostgreSQL until a database-backed API operation is exercised.

## Local PostgreSQL

The development compose file is `compose.dev.yaml`. It exposes PostgreSQL only on `127.1.0.1:5432` and persists data in a named Docker volume.

```bash
pnpm db:local:ensure
pnpm db:local:status
pnpm db:local:logs
pnpm db:local:down
```

A destructive reset is explicit:

```bash
pnpm db:local:reset
```

The local DB helper refuses to start/stop/reset the bundled service when `DATABASE_URL` points to a non-local host. Remote databases such as Supabase remain operator-managed.

## Strict stack startup

`pnpm dev:stack` is intentionally not a bootstrap command. Before spawning the Bridge and three workers it requires:

- the critical pnpm workspace dependencies to resolve;
- environment bootstrap to complete;
- Prisma Client to match the current schema;
- PostgreSQL to be reachable.

This prevents partial startup where workers run while the Next.js app or database layer is broken.

## VS Code Dev Container

PowerChain includes `.devcontainer/devcontainer.json` plus a Compose override. The editor attaches to the Node `workspace` service, not PostgreSQL. Supporting PostgreSQL starts on the internal Compose network and the override removes its base host-port publication.

The host-side initialize command creates `.devcontainer/devcontainer.env` with a random local-only PostgreSQL credential. That file is ignored by Git and Docker build contexts.

Open the repository with **Dev Containers: Reopen in Container** and see [`DEVCONTAINER.md`](DEVCONTAINER.md) for the complete lifecycle.
