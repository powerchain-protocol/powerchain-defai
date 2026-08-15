# Node.js and nvm

PowerChain Bridge uses Node.js 26.5.0 for local development.

```bash
# nvm 0.40.6+
nvm install
nvm use
corepack enable
corepack prepare pnpm@11.21.0 --activate
pnpm install
```

Canonical pins:

- `.nvmrc`: `26.5.0`
- `.node-version`: `26.5.0`
- `packageManager`: `pnpm@11.21.0`
- `engines.node`: `>=24.18.0 <27`

The wider engine range intentionally retains Node 24 LTS production compatibility for providers that have not enabled Node 26 Current yet. Local development and CI that opt into the repository pin use Node 26.5.0.

Run:

```bash
pnpm node:check
pnpm nvm:check
pnpm verify:production
```
