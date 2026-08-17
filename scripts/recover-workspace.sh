#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# A subprocess cannot change the caller's Node version, so this recovery script
# performs the entire repair in one correctly activated shell.
# shellcheck disable=SC1091
source "$SCRIPT_DIR/bootstrap-toolchain.sh"

pnpm workspace:repair
pnpm workspace:install:check

echo "[recovery] Workspace install is healthy."
echo "[recovery] This script ran in a child shell. Before running pnpm commands in your current shell, run:"
echo "  source ./bootstrap.sh"
