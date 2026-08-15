# Production validation

PowerChain Bridge stays at version `1.0.0`.

## Completed in this build environment

The consolidated source tree passed all source-level production gates, including:

- workspace/package/version integrity;
- TypeScript/TSX syntax parsing across 239 source files;
- bridge core and runtime wiring;
- claim/assets and claim/bridge orchestration;
- RPC/data/provider checks;
- wallet/portfolio and wallet-flow checks;
- service-fee checks;
- UI/UX checks;
- canonical operation recovery/journal checks;
- API registry/filesystem route coverage;
- local relative import resolution;
- mirrored database migration integrity.

Additional build-hardening fixes applied during the dependency-aware attempt:

- normalized backend ESM relative imports that incorrectly ended in `.ts`;
- fixed `apps/bridge/tsconfig.json` alias resolution by making its `baseUrl` app-local;
- added explicit Node type declarations to Node-targeted workspaces;
- corrected service-fee operator authorization imports and error-response ordering;
- corrected `exactOptionalPropertyTypes` object construction in governance/readiness code;
- configured Prisma 7 client generation explicitly for `runtime = "nodejs"`, `moduleFormat = "esm"`, and TypeScript import extensions.

## Dependency-aware gate attempt

The following command sequence is the canonical final validation gate:

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:validate
pnpm typecheck
pnpm build
```

The environment has Node `22.16.0` and global TypeScript `5.8.3`, but package installation cannot currently start because outbound DNS for `registry.npmjs.org` fails with `EAI_AGAIN`. Corepack therefore cannot download the pinned `pnpm@11.21.0` package. Because dependencies are not installed, Prisma CLI generation/validation and the real Next.js production build cannot truthfully be marked PASS in this environment.

The repository now exposes the combined commands:

```bash
pnpm validate:dependency-aware
pnpm validate:all
```

`validate:all` runs source production verification followed by Prisma generation, Prisma validation, workspace typechecking and the Next.js production build.

## Database/live-chain gates

Against the intended production database:

```bash
pnpm db:status
pnpm db:migrate:deploy
```

Live deployment additionally requires the real Solana/Sui RPC endpoints, PWRC/wPWRC identifiers, Wormhole NTT manager/transceiver deployment data, signer/HSM configuration, fee policy, and wallet execution tests. Source checks do not replace those external-system validations.


## 2026-08-15 pnpm 11.21.0 dependency-aware gate

The source tree is pinned to `pnpm@11.21.0`. A direct `corepack prepare pnpm@11.21.0 --activate` was attempted in this execution environment and failed before installation because the registry request for `pnpm-11.21.0.tgz` could not be completed. Source-level production, migration-parity, environment, workspace-import, and TypeScript syntax gates pass; dependency-aware Prisma/Next gates must run where registry access is available.
