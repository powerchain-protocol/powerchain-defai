#!/usr/bin/env bash
set -euo pipefail
if ! command -v nvm >/dev/null 2>&1; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
  else
    echo "nvm is not installed/loaded. Install nvm 0.40.6 first, then rerun pnpm setup." >&2
    exit 1
  fi
fi
nvm install
nvm use
corepack enable
corepack prepare pnpm@11.21.0 --activate
node scripts/require-node.mjs
node scripts/require-pnpm.mjs || true
printf '\nNode: '; node --version
printf 'pnpm: '; pnpm --version
