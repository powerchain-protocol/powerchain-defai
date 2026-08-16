# Build Recovery

Use pnpm only. If npm was run in the workspace, remove its lockfile and mixed
installation before running pnpm again.

```bash
nvm use
corepack enable
corepack prepare pnpm@11.22.0 --activate
pnpm clean:package-manager
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

Node `24.14.0` is accepted by the repository engine range. `.nvmrc` targets the Node 24 LTS line and `nvm use` may use any supported Node 24.x installation.

`pnpm install` runs `prisma generate` in `postinstall`, so the generated Prisma
client exists before editor/typecheck/build work begins.

Then run:

```bash
pnpm env:check
pnpm db:check:migrations
pnpm typecheck
pnpm test:protocol
pnpm build:production
```

The repository intentionally does not use TypeScript `baseUrl`. If an editor
still reports that deprecation, reload the workspace TypeScript server and make
sure VS Code is using `node_modules/typescript/lib` from this repository.

## Workspace doctor

After a clean pnpm install, run:

```bash
pnpm doctor
```

The doctor detects unsupported Node/pnpm versions, npm/yarn lockfile contamination,
`node_modules/.ignored`, missing workspace links, a missing generated Prisma client,
missing environment templates, deprecated TypeScript `baseUrl`, and the remote Vercel
schema configuration that can trigger editor trust diagnostics.

Direct Bridge and worker `dev`, `start`, `build`, and typecheck entry points regenerate
the Prisma client before loading database code. This keeps a clean clone and an IDE
workspace from depending on a stale generated client.
