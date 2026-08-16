# Supabase Migration Mirror

`supabase/migrations/` mirrors the canonical Prisma migration sequence for hosted Supabase/PostgreSQL deployments. Prisma remains the application schema source of truth.

Before release, run:

```bash
pnpm db:check:migrations
pnpm prisma:validate
```

Do not edit only one migration set. Every canonical Prisma migration must have the matching Supabase mirror required by the repository migration checker.

Runtime Supabase credentials belong in local/deployment environment configuration, never in checked-in migration files.
