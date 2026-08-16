# Prisma Database

`prisma/schema.prisma` is the canonical application schema. Production migrations live under `prisma/migrations/` and are mirrored to `supabase/migrations/` for hosted Supabase/PostgreSQL deployments.

Common commands:

```bash
pnpm prisma:generate
pnpm prisma:validate
pnpm db:status
pnpm db:migrate:deploy
pnpm db:check:migrations
```

For local schema development only:

```bash
pnpm db:migrate:dev
```

Do not run `prisma migrate dev` against production. Migration parity is part of the release safety gates.

See [`../docs/VALIDATION.md`](../docs/VALIDATION.md) and [`../docs/BACKEND_OPERATIONS.md`](../docs/BACKEND_OPERATIONS.md).
