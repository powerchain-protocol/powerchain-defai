#!/usr/bin/env bash
# Offline regression test for the zero-assumption bootstrap.
# It presents bootstrap.sh with no visible node/npm/pnpm and a pre-seeded,
# minimal Node 24.19.0 toolchain fixture whose npm verifies that node is already
# on PATH before pnpm installation begins.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/powerchain-toolchain-selftest.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

FAKE_BIN="$TMP/bin"
FAKE_HOME="$TMP/home"
NODE_BIN="$FAKE_HOME/.local/share/powerchain/toolchains/node-v24.19.0-linux-x64/bin"
mkdir -p "$FAKE_BIN" "$NODE_BIN"

# Only expose commands the bootstrap needs. Intentionally omit node/npm/pnpm.
for command_name in dirname uname mkdir mktemp curl wget awk sha256sum shasum tar rm mv cat chmod; do
  resolved="$(command -v "$command_name" 2>/dev/null || true)"
  [[ -n "$resolved" ]] && ln -s "$resolved" "$FAKE_BIN/$command_name"
done

cat > "$NODE_BIN/node" <<'NODEEOF'
#!/usr/bin/bash
if [[ "${1:-}" == "--version" ]]; then
  printf 'v24.19.0\n'
  exit 0
fi
exec /usr/bin/node "$@"
NODEEOF
chmod +x "$NODE_BIN/node"

cat > "$NODE_BIN/npm" <<'NPMEOF'
#!/usr/bin/bash
set -euo pipefail
command -v node >/dev/null 2>&1 || { echo "SELFTEST_NODE_NOT_ON_PATH" >&2; exit 88; }
[[ "$(node --version)" == "v24.19.0" ]] || { echo "SELFTEST_WRONG_NODE" >&2; exit 89; }
prefix=""
previous=""
for argument in "$@"; do
  [[ "$previous" == "--prefix" ]] && prefix="$argument"
  previous="$argument"
done
[[ -n "$prefix" ]] || { echo "SELFTEST_PREFIX_MISSING" >&2; exit 90; }
mkdir -p "$prefix/bin"
cat > "$prefix/bin/pnpm" <<'PNPMEOF'
#!/usr/bin/bash
if [[ "${1:-}" == "--version" ]]; then
  printf '11.22.0\n'
  exit 0
fi
printf 'selftest-pnpm %s\n' "$*"
PNPMEOF
chmod +x "$prefix/bin/pnpm"
NPMEOF
chmod +x "$NODE_BIN/npm"

OUTPUT="$TMP/output.txt"
/usr/bin/bash --noprofile --norc -c '
  set -e
  export HOME="'"$FAKE_HOME"'"
  export PATH="'"$FAKE_BIN"'"
  cd "'"$ROOT"'"
  source ./bootstrap.sh
  [[ "$(node --version)" == "v24.19.0" ]]
  [[ "$(pnpm --version)" == "11.22.0" ]]
' >"$OUTPUT" 2>&1

grep -q 'Node: v24.19.0' "$OUTPUT"
grep -q 'pnpm: 11.22.0' "$OUTPUT"
! grep -q 'SELFTEST_NODE_NOT_ON_PATH' "$OUTPUT"

printf 'TOOLCHAIN_BOOTSTRAP_SELFTEST_PASS — bootstrap succeeds with no preinstalled node/npm/pnpm and exports Node before npm\n'
