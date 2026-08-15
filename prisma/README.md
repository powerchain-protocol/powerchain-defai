# Database schema

`schema.prisma` is the canonical Prisma schema. Production migrations live in `prisma/migrations/`.
Supabase-compatible mirrors live in `supabase/migrations/` and are checked by `pnpm db:check:migrations`.

Commands: `pnpm prisma:generate`, `pnpm prisma:validate`, `pnpm db:status`, `pnpm db:migrate:deploy`.
Never run `migrate dev` against production.
