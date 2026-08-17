#!/usr/bin/env bash
# PowerChain DeFAI user-local toolchain bootstrap.
#
# Preferred interactive usage:
#   source ./bootstrap.sh
#
# This script intentionally does not require nvm, Corepack, or a preinstalled
# pnpm binary. If Node 24.19.0 is unavailable it downloads the official Node.js
# binary distribution, verifies its SHA-256 checksum, installs it below $HOME,
# then installs pnpm 11.22.0 with that exact Node runtime.

POWERCHAIN_NODE_VERSION="24.19.0"
POWERCHAIN_PNPM_VERSION="11.22.0"
POWERCHAIN_TOOLCHAIN_ROOT="${POWERCHAIN_TOOLCHAIN_ROOT:-$HOME/.local/share/powerchain/toolchains}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

pc_log() {
  printf '[toolchain] %s\n' "$1"
}

pc_fail() {
  printf '[toolchain] %s\n' "$1" >&2
  return 1
}

pc_download() {
  local url="$1" output="$2"
  if command -v curl >/dev/null 2>&1; then
    curl --fail --silent --show-error --location --retry 3 --retry-delay 1 "$url" --output "$output"
  elif command -v wget >/dev/null 2>&1; then
    wget --https-only --quiet --output-document="$output" "$url"
  else
    pc_fail "curl or wget is required to bootstrap Node.js."
  fi
}

pc_sha256() {
  local file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$file" | awk '{print $1}'
  else
    pc_fail "sha256sum or shasum is required to verify the Node.js download."
  fi
}

pc_platform() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"
  case "$os" in
    Linux) os="linux" ;;
    Darwin) os="darwin" ;;
    *) pc_fail "Unsupported operating system '$os'. Use the repository Dev Container instead."; return 1 ;;
  esac
  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    *) pc_fail "Unsupported CPU architecture '$arch'. Use the repository Dev Container instead."; return 1 ;;
  esac
  printf '%s-%s\n' "$os" "$arch"
}

pc_install_node() {
  local platform="$1" node_home="$2"
  local tmp_dir archive dist expected actual extracted
  mkdir -p "$POWERCHAIN_TOOLCHAIN_ROOT"
  tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/powerchain-node.XXXXXX")" || return 1
  archive="node-v${POWERCHAIN_NODE_VERSION}-${platform}.tar.gz"
  dist="https://nodejs.org/dist/v${POWERCHAIN_NODE_VERSION}"

  pc_log "Installing Node ${POWERCHAIN_NODE_VERSION} locally for ${platform}."
  pc_download "$dist/$archive" "$tmp_dir/$archive" || { rm -rf "$tmp_dir"; return 1; }
  pc_download "$dist/SHASUMS256.txt" "$tmp_dir/SHASUMS256.txt" || { rm -rf "$tmp_dir"; return 1; }

  expected="$(awk -v file="$archive" '$2 == file {print $1}' "$tmp_dir/SHASUMS256.txt")"
  if [[ -z "$expected" ]]; then
    rm -rf "$tmp_dir"
    pc_fail "Official checksum for $archive was not found."
    return 1
  fi
  actual="$(pc_sha256 "$tmp_dir/$archive")" || { rm -rf "$tmp_dir"; return 1; }
  if [[ "$actual" != "$expected" ]]; then
    rm -rf "$tmp_dir"
    pc_fail "Node.js archive checksum verification failed."
    return 1
  fi

  mkdir -p "$tmp_dir/extract"
  tar -xzf "$tmp_dir/$archive" -C "$tmp_dir/extract" || { rm -rf "$tmp_dir"; return 1; }
  extracted="$tmp_dir/extract/node-v${POWERCHAIN_NODE_VERSION}-${platform}"
  if [[ ! -x "$extracted/bin/node" ]]; then
    rm -rf "$tmp_dir"
    pc_fail "Downloaded Node.js archive is missing the node executable."
    return 1
  fi
  if [[ "$("$extracted/bin/node" --version 2>/dev/null || true)" != "v${POWERCHAIN_NODE_VERSION}" ]]; then
    rm -rf "$tmp_dir"
    pc_fail "Downloaded Node.js executable failed its version self-check."
    return 1
  fi

  rm -rf "$node_home"
  mv "$extracted" "$node_home"
  rm -rf "$tmp_dir"
}

pc_bootstrap_main() {
  local platform node_home node_bin active_node_version installed_node_version current_node
  local pnpm_prefix pnpm_bin current_pnpm env_file

  # Keep version markers present even when a copy operation omitted hidden files.
  printf '%s\n' "$POWERCHAIN_NODE_VERSION" > "$REPO_ROOT/.nvmrc" || return 1
  printf '%s\n' "$POWERCHAIN_NODE_VERSION" > "$REPO_ROOT/.node-version" || return 1

  platform="$(pc_platform)" || return 1
  node_home="$POWERCHAIN_TOOLCHAIN_ROOT/node-v${POWERCHAIN_NODE_VERSION}-${platform}"
  node_bin="$node_home/bin/node"

  active_node_version="$(node --version 2>/dev/null || true)"
  installed_node_version=""
  if [[ -x "$node_bin" ]]; then
    installed_node_version="$("$node_bin" --version 2>/dev/null || true)"
  fi

  # A partial/stale installation must be replaced, not trusted because bin/node exists.
  if [[ "$active_node_version" != "v${POWERCHAIN_NODE_VERSION}" && "$installed_node_version" != "v${POWERCHAIN_NODE_VERSION}" ]]; then
    [[ -d "$node_home" ]] && pc_log "Removing incomplete local Node installation at $node_home."
    rm -rf "$node_home"
    pc_install_node "$platform" "$node_home" || return 1
  fi

  # If the desired runtime is not already the shell runtime, put our verified local
  # distribution first on PATH *before* invoking npm. npm uses /usr/bin/env node.
  if [[ "$active_node_version" != "v${POWERCHAIN_NODE_VERSION}" ]]; then
    export POWERCHAIN_NODE_HOME="$node_home"
    export PATH="$POWERCHAIN_NODE_HOME/bin:$PATH"
    hash -r 2>/dev/null || true
  else
    export POWERCHAIN_NODE_HOME="${POWERCHAIN_NODE_HOME:-$(cd "$(dirname "$(command -v node)")/.." 2>/dev/null && pwd || true)}"
  fi

  current_node="$(node --version 2>/dev/null || true)"
  if [[ "$current_node" != "v${POWERCHAIN_NODE_VERSION}" ]]; then
    pc_fail "Expected Node v${POWERCHAIN_NODE_VERSION}; detected '${current_node:-none}'."
    return 1
  fi

  # Ensure npm belongs to the active pinned Node runtime before using it to install pnpm.
  if ! command -v npm >/dev/null 2>&1; then
    pc_fail "Node ${POWERCHAIN_NODE_VERSION} is active but npm is unavailable. Re-run the bootstrap to repair the local Node distribution."
    return 1
  fi

  pnpm_prefix="$POWERCHAIN_TOOLCHAIN_ROOT/pnpm-${POWERCHAIN_PNPM_VERSION}"
  pnpm_bin="$pnpm_prefix/bin/pnpm"
  current_pnpm="$(pnpm --version 2>/dev/null || true)"

  if [[ "$current_pnpm" != "$POWERCHAIN_PNPM_VERSION" ]]; then
    if [[ ! -x "$pnpm_bin" ]]; then
      pc_log "Installing pnpm ${POWERCHAIN_PNPM_VERSION} locally with Node ${POWERCHAIN_NODE_VERSION} npm."
      rm -rf "$pnpm_prefix"
      mkdir -p "$pnpm_prefix"
      npm install --global --prefix "$pnpm_prefix" --ignore-scripts "pnpm@${POWERCHAIN_PNPM_VERSION}" || {
        rm -rf "$pnpm_prefix"
        pc_fail "pnpm ${POWERCHAIN_PNPM_VERSION} installation failed."
        return 1
      }
    fi
    export PNPM_HOME="$pnpm_prefix/bin"
    export PATH="$PNPM_HOME:$PATH"
    hash -r 2>/dev/null || true
  else
    export PNPM_HOME="${PNPM_HOME:-$(dirname "$(command -v pnpm)")}" 
  fi

  current_pnpm="$(pnpm --version 2>/dev/null || true)"
  if [[ "$current_pnpm" != "$POWERCHAIN_PNPM_VERSION" ]]; then
    pc_fail "Expected pnpm ${POWERCHAIN_PNPM_VERSION}; detected '${current_pnpm:-none}'."
    return 1
  fi

  # Write an opt-in helper for future shells without modifying shell rc files.
  env_file="$POWERCHAIN_TOOLCHAIN_ROOT/env.sh"
  cat > "$env_file" <<ENVEOF
export POWERCHAIN_NODE_HOME="$node_home"
export PNPM_HOME="$pnpm_prefix/bin"
export PATH="\$PNPM_HOME:\$POWERCHAIN_NODE_HOME/bin:\$PATH"
ENVEOF
  chmod 600 "$env_file" 2>/dev/null || true

  pc_log "Repository: $REPO_ROOT"
  pc_log "Node: $current_node"
  pc_log "pnpm: $current_pnpm"
  pc_log "Future shell helper: source $env_file"
  return 0
}

pc_bootstrap_main
pc_status=$?

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  if [[ "$pc_status" -eq 0 ]]; then
    printf '[toolchain] NOTE: this script was executed, not sourced.\n' >&2
    printf '[toolchain] Run: source ./bootstrap.sh\n' >&2
    printf '[toolchain] This is required for Node/pnpm to remain on PATH in the current terminal.\n' >&2
  fi
  exit "$pc_status"
fi

return "$pc_status"
