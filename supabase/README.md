# Supabase migrations

These SQL files mirror the canonical Prisma migration sequence for hosted Supabase/PostgreSQL deployments.
Run `pnpm db:check:migrations` before release to ensure migration-name parity. Prisma remains the application schema source of truth.
