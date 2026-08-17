# Node and pnpm runtime

PowerChain DeFAI requires Node `>=24 <26` and pnpm `>=11.22.0 <12`. Reproducible development pins Node `24.19.0` and pnpm `11.22.0`. The engine range supports Node 24.3+ on the Node 24 line; reproducible development pins Node 24.19.0. The backend keeps Cetus behind a runtime-neutral HTTPS adapter so the workspace is not constrained by a provider SDK's narrower transitive engine.

Neither nvm nor Corepack is required. The repository provides a user-local bootstrap that can install the pinned Node binary and pnpm CLI without administrator access.

From the repository root:

```bash
source ./bootstrap.sh
node --version
pnpm --version
```

The bootstrap downloads Node only when the active runtime is not the pinned version, verifies the official Node archive against `SHASUMS256.txt`, and installs pnpm into the PowerChain user-local toolchain directory.

For future shells, the bootstrap prints the generated environment helper path. Source that helper or source `./bootstrap.sh` again.

The Dev Container is simpler: pnpm is installed into the image at build time, so no runtime bootstrap is needed after the container is rebuilt.
