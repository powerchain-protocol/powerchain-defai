#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/bootstrap-toolchain.sh"
node scripts/require-node.mjs
pnpm env:bootstrap
printf '\nNode: '; node --version
printf 'pnpm: '; pnpm --version
printf 'Setup complete. See README.md for workspace bootstrap and database steps.\n'
