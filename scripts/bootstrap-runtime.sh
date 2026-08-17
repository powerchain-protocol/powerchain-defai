#!/usr/bin/env bash
# Compatibility entrypoint. When pnpm is missing, source ./bootstrap.sh instead
# so the toolchain remains available in the current terminal.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  echo "[runtime] This command can install/verify the toolchain, but an executed child shell cannot update the parent PATH." >&2
  echo "[runtime] Preferred command: source ./bootstrap.sh" >&2
fi
# shellcheck disable=SC1091
source "$SCRIPT_DIR/bootstrap-toolchain.sh"
node "$SCRIPT_DIR/require-node.mjs"
pnpm --version
echo "[runtime] Toolchain ready in this shell."
