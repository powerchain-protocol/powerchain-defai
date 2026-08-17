# Dev Container

PowerChain includes a Docker Compose-based VS Code Dev Container for Node 24 + TypeScript + pnpm development with a sibling PostgreSQL service.

## Architecture

The editor attaches to the `workspace` service. It does not attach to the database container.

```text
VS Code / Codespaces
        |
        v
workspace (Node 24)
        |
        | Compose network only
        v
postgres (PostgreSQL 17)
```

The devcontainer override removes the base PostgreSQL host-port publication. Application port `3000` is the only configured forwarded development port. The devcontainer database uses its own named volume so credentials and schema state do not collide with a separately started host-local PostgreSQL Compose instance.

## Secret handling

`.devcontainer/init-env.sh` runs before container creation and creates:

```text
.devcontainer/devcontainer.env
```

with a randomly generated local PostgreSQL password. The file is mode `0600` where the host filesystem supports POSIX permissions and is excluded from Git and Docker build contexts.

The generated file contains only local development database settings. RPC keys, wallet material, signer secrets, provider API keys, and production credentials remain in the repository's ignored `.env` / `.env.local` files or external secret stores.

Do not put secrets directly in `devcontainer.json` or the checked-in Compose override.

## Open in VS Code

Use **Dev Containers: Reopen in Container**. The configuration starts both `workspace` and `postgres`, waits for PostgreSQL health, and then runs `.devcontainer/post-create.sh`.

The post-create flow:

1. verifies the pinned Node 24 workspace image and preinstalled pnpm 11.22.0;
2. initializes ignored environment files;
3. installs from `pnpm-lock.yaml` with `--frozen-lockfile` when present, otherwise creates the first lockfile with `--no-frozen-lockfile`;
4. checks reviewed dependency build scripts;
5. refreshes and validates Prisma Client;
6. verifies critical workspace dependency resolution.

It does not apply database migrations automatically.

## Start PowerChain

App/API shell:

```bash
pnpm dev
```

Full database-backed stack:

```bash
pnpm db:migrate:deploy
pnpm dev:stack
```

`bash scripts/dev-stack-bootstrap.sh` is also devcontainer-aware: it verifies the already-installed workspace instead of deleting/regenerating the lockfile.

Inside the devcontainer, `DATABASE_URL` points to the Compose hostname `postgres`, not `127.1.0.1`.

## Database lifecycle

The Dev Containers Compose lifecycle owns PostgreSQL. `pnpm db:local:ensure` can confirm reachability, but destructive stop/reset operations are intentionally refused from inside the workspace container. Use the Dev Containers lifecycle from VS Code/Codespaces or rebuild the Dev Container when that lifecycle operation is actually intended. Do not invoke a legacy `docker-compose` task inside the workspace container.
