#!/usr/bin/env bash
set -euo pipefail
if ! command -v nvm >/dev/null 2>&1; then
  echo "nvm is not loaded in this shell." >&2
  echo 'Load it with: export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"' >&2
  exit 1
fi
CURRENT_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [[ "$CURRENT_MAJOR" != "24" ]]; then
  echo "Expected Node 24.x from .nvmrc; detected $(node --version)." >&2
  echo "Run: nvm install 24 && nvm use 24" >&2
  exit 1
fi
echo "nvm/Node OK: $(node --version)"
