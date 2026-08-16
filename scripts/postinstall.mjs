import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.log("[postinstall] DATABASE_URL is not set; skipping Prisma generation. Run `pnpm env:bootstrap` and then `pnpm prisma:generate`.");
  process.exit(0);
}

const result = spawnSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["prisma:generate"], { stdio: "inherit", env: process.env });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
