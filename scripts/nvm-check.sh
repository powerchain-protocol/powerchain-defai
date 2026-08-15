#!/usr/bin/env bash
set -euo pipefail
EXPECTED="$(tr -d '[:space:]' < .nvmrc)"
if ! command -v nvm >/dev/null 2>&1; then
  echo "nvm is not loaded in this shell. Latest supported nvm is 0.40.6." >&2
  echo 'Load it with: export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"' >&2
  exit 1
fi
CURRENT="$(node -p 'process.versions.node')"
if [[ "$CURRENT" != "$EXPECTED" ]]; then
  echo "Expected Node $EXPECTED from .nvmrc; detected $CURRENT." >&2
  echo "Run: nvm install && nvm use" >&2
  exit 1
fi
echo "nvm/Node OK: $CURRENT"
