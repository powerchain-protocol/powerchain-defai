#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Runs all recovery steps in one shell so the bootstrapped Node/pnpm PATH persists.
# shellcheck disable=SC1091
source "$SCRIPT_DIR/bootstrap-toolchain.sh"

if [[ "${POWERCHAIN_DEVCONTAINER:-0}" == "1" ]]; then
  printf '\n[dev:bootstrap] Devcontainer detected; verifying the existing pnpm workspace without deleting its lockfile.\n'
  pnpm workspace:install:check
else
  printf '\n[dev:bootstrap] Repairing/installing the pnpm workspace.\n'
  pnpm workspace:repair
  pnpm workspace:install:check
fi

printf '\n[dev:bootstrap] Initializing local environment files.\n'
pnpm env:bootstrap

printf '\n[dev:bootstrap] Ensuring PostgreSQL is available.\n'
pnpm db:local:ensure

printf '\n[dev:bootstrap] Applying checked-in Prisma migrations.\n'
pnpm db:migrate:deploy

printf '\n[dev:bootstrap] Starting Bridge + workers.\n'
exec pnpm dev:stack
