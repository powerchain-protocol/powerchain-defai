# Contributing to PowerChain DeFAI

PowerChain DeFAI is a private pnpm monorepo. Keep changes scoped, reproducible, and compatible with the repository's production safety boundaries.

## Toolchain

- Node.js `>=24 <26`
- pnpm `>=11.22.0 <12`
- pnpm is the only supported package manager

Use `pnpm install --frozen-lockfile` when a committed lockfile is present. Use `pnpm install --no-frozen-lockfile` only when intentionally changing dependencies, then review and commit the updated `pnpm-lock.yaml`.

## Development workflow

1. Run `pnpm setup` for repository bootstrap.
2. Use `pnpm dev:stack` for the application and worker development surfaces.
3. Keep first-party dependencies declared with `workspace:*` in the consuming package.
4. Keep secrets in ignored runtime environment files; update only the corresponding `.env*.example` template when adding configuration.
5. Run `pnpm check:fast` during development and `pnpm verify:production` before review.
6. Run `pnpm validate:all` and `pnpm release:check` before production promotion in a dependency-backed environment.

## Repository rules

Do not commit `node_modules`, `.next`, `.open-next`, build output, caches, local environment files, temporary files, package-manager lockfiles other than `pnpm-lock.yaml`, or generated credentials. Do not weaken wallet-signing, runtime-deployment, migration, rate-limit, idempotency, reconciliation, or cross-chain safety checks to make a build pass.

All workspaces remain `private: true` for publish safety and use the MIT license. See the root `LICENSE` and `docs/SECURITY.md`.
