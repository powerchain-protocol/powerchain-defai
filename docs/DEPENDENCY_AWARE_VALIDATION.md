# Dependency-aware production validation

The source-level production checks do not replace dependency-aware framework validation.
Run the following from the repository root with Node 22.16+ and pnpm 11.21.0:

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:validate
pnpm typecheck
pnpm build
```

Or run the combined gate:

```bash
pnpm validate:all
```

## Required environment for Prisma CLI

`prisma.config.ts` reads `DATABASE_URL`. For schema generation/validation, set a syntactically valid PostgreSQL URL. A live database is required only for migration status/deploy and runtime database operations.

## Runtime deployment gates

Before mainnet deployment, provide the real PowerChain Solana/Sui RPC endpoints, PWRC/wPWRC identifiers, Wormhole NTT deployment configuration, signer/HSM configuration, and service-fee policy values. Never place private keys or provider secrets in `NEXT_PUBLIC_*` variables.
