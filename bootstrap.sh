#!/usr/bin/env bash
# Source this file from the repository root:
#   source ./bootstrap.sh
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  echo "PowerChain bootstrap must be sourced so Node and pnpm remain on PATH." >&2
  echo "Run: source ./bootstrap.sh" >&2
  exit 2
fi
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/bootstrap-toolchain.sh" || return $?
