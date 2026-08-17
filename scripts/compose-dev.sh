#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  exec docker compose -f compose.dev.yaml "$@"
fi
if command -v docker-compose >/dev/null 2>&1; then
  echo "[compose] Legacy docker-compose detected; prefer Docker Compose v2 ('docker compose')." >&2
  exec docker-compose -f compose.dev.yaml "$@"
fi
cat >&2 <<'MSG'
[compose] Docker Compose is not available in this shell.
[compose] Do not run a docker-compose VS Code task from inside the PowerChain Dev Container.
[compose] Preferred: rebuild/reopen the repository using .devcontainer/devcontainer.json;
[compose] the Dev Containers lifecycle starts PostgreSQL as a sibling service.
[compose] Outside the Dev Container, install Docker with the Compose plugin or point DATABASE_URL to an existing PostgreSQL instance.
MSG
exit 127
