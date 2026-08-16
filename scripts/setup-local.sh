#!/usr/bin/env bash
set -euo pipefail
if ! command -v nvm >/dev/null 2>&1; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
  else
    echo "nvm is not installed/loaded. Install nvm 0.40.6 first, then rerun: bash scripts/setup-local.sh" >&2
    exit 1
  fi
fi
nvm install 24
nvm use 24
corepack enable
corepack prepare pnpm@11.22.0 --activate
node scripts/require-node.mjs
PNPM_VERSION="$(pnpm --version)"
if [[ "$PNPM_VERSION" != "11.22.0" ]]; then
  echo "Expected pnpm 11.22.0; detected $PNPM_VERSION" >&2
  exit 1
fi
node scripts/bootstrap-env.mjs
printf '\nNode: '; node --version
printf 'pnpm: '; pnpm --version
