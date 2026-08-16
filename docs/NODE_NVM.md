# Node.js and nvm

PowerChain DeFAI supports the Node.js 24 LTS line for local development and deployment.

```bash
# nvm 0.40.6+
nvm install 24
nvm use 24
corepack enable
corepack prepare pnpm@11.22.0 --activate
pnpm install
```

Canonical pins:

- `.nvmrc`: `24`
- `.node-version`: `24`
- `packageManager`: `pnpm@11.22.0`
- `engines.node`: `>=24 <25`

The engine range intentionally stays on the Node 24 LTS line for Vercel Functions compatibility. Local development and CI use Node 24.x.

Run:

```bash
pnpm node:check
pnpm nvm:check
pnpm verify:production
```
