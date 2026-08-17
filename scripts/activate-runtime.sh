#!/usr/bin/env bash
# Backward-compatible alias. Prefer:
#   source ./bootstrap.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/bootstrap-toolchain.sh"
