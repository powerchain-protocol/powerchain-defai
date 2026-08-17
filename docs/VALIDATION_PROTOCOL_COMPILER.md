# Protocol and compiler validation

This release validates the consolidated PowerChain Bridge `1.0.0` source tree after
the real Wormhole NTT bridge, protocol/program layout, TypeScript hygiene, Sui gRPC,
Prisma 7.9.1, wallet provider, integrations, and package-manager recovery changes.

## Source-level gates executed

- Environment contract validation.
- Prisma/Supabase byte-identical migration validation.
- Workspace configuration and package-boundary validation.
- TypeScript hygiene validation, including no deprecated `baseUrl`, no legacy `SuiClient`, no untyped Prisma transaction callbacks, and no generic calls on untyped raw queries.
- Markdown MD022/MD032 structural validation.
- TypeScript/TSX parser sweep.
- Failure-safety, platform, operations, real-bridge, protocol, and full-production gates.
- Root protocol layout test and program placeholder policy check.
- API route registry regeneration and filesystem coverage check.

## Dependency-aware gate

A complete environment with the pinned package manager should run:

```bash
source ./bootstrap.sh
pnpm clean:package-manager
pnpm install
pnpm doctor
pnpm prisma:generate
pnpm prisma:validate
pnpm typecheck
pnpm build:production
```

The source package intentionally does not claim a successful dependency-aware Next.js
build in an environment where the npm registry or the pinned Node/pnpm runtime is not
available. `pnpm doctor` reports the exact missing installation or generated-client
condition before development or build commands are attempted.
