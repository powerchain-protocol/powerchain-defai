# Release tooling

PowerChain Bridge 1.0.0 standardizes local development, Vercel deployment, package-manager lifecycle approval, route validation, and API tooling.

## Runtime pins

- Node.js: `24.19.0` via `.nvmrc` and `.node-version`, with package engines enforcing `>=24 <26`.
- pnpm: `11.22.0` via `packageManager` and Vercel Corepack activation.
- Next.js telemetry: disabled for all repository Next commands through `scripts/next-cli.mjs`; Vercel also sets `NEXT_TELEMETRY_DISABLED=1` during the build.

## pnpm dependency builds

`pnpm-workspace.yaml` uses `allowBuilds` and `verifyDepsBeforeRun: warn`. The latter prevents repair/bootstrap scripts from auto-triggering an install before they can repair dependency approval state. This is the source-controlled equivalent of approving reviewed dependency lifecycle scripts. Do not add packages merely to silence an ignored-build warning. Review the package and the reason its lifecycle script is required first.

For the existing reviewed set, use the deterministic non-interactive helper:

```bash
pnpm deps:builds:approve:reviewed
```

If a genuinely new dependency needs an install build, use `pnpm approve-builds`, review the package, then mirror the approved package in `scripts/approve-reviewed-builds.mjs`. Never enable all dependency builds globally.

## Lockfile policy

Production CI should use `pnpm install --frozen-lockfile` once `pnpm-lock.yaml` exists. This source archive does not fabricate a lockfile without pnpm registry resolution. Until a real lockfile is generated, Vercel uses `--no-frozen-lockfile` so deployment is not guaranteed to fail solely because the archive lacks one. Generate and commit a real lockfile before treating dependency resolution as deterministic release evidence.

## Vercel

`vercel.json` keeps deployment configuration intentionally small. Next.js owns framework routing, redirects, and security headers; Vercel owns framework detection plus install/build commands. This avoids maintaining duplicate routing rules in two configuration layers.

## Redirects

Next.js owns canonical legacy redirects:

- `/` → `/bridge` (temporary entry redirect)
- `/home` → `/bridge`
- `/app` → `/bridge`
- `/trade` → `/swap`
- `/transactions` → `/history`
- `/api` → `/api/v1/openapi` (temporary discovery redirect)

Run `pnpm routes:check` after API or redirect changes.

## Postman and OpenAPI

The checked-in Postman collection is generated from `shared/actions.json`. `api/swagger.yaml` and `/api/v1/openapi` remain the schema-rich API definitions and can also be imported directly into Postman.

Run:

```bash
pnpm api:generate
pnpm postman:check
pnpm routes:check
```

## Release validation

Source-only release tooling:

```bash
pnpm release-tooling:production:check
pnpm release:check
```

Dependency-aware validation still requires an installed dependency graph, Prisma generation, TypeScript checking, and a real Next.js build.
