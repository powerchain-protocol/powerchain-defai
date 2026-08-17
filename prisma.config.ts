import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Prisma 7 generate/validate do not require a live database URL. Leaving this
  // undefined keeps install/typecheck/build usable before local env bootstrap;
  // migrate/db commands still fail closed until DATABASE_URL is configured.
  datasource: { url: process.env.DATABASE_URL },
});
