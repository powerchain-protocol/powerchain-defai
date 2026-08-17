import { PrismaPg } from "@prisma/adapter-pg";
import { parseBoundedInteger } from "@powerchain/runtime";
import { Prisma, PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as { __powerchainPrisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL_REQUIRED");

  const poolMax = parseBoundedInteger(process.env.POWERCHAIN_DB_POOL_MAX, 10, { min: 1, max: 50 });
  const connectionTimeoutMillis = parseBoundedInteger(process.env.POWERCHAIN_DB_CONNECT_TIMEOUT_MS, 5_000, { min: 1_000, max: 30_000 });
  const idleTimeoutMillis = parseBoundedInteger(process.env.POWERCHAIN_DB_IDLE_TIMEOUT_MS, 300_000, { min: 1_000, max: 900_000 });
  const maxLifetimeSeconds = parseBoundedInteger(process.env.POWERCHAIN_DB_MAX_LIFETIME_SECONDS, 0, { min: 0, max: 86_400 });

  const adapter = new PrismaPg({
    connectionString,
    max: poolMax,
    connectionTimeoutMillis,
    idleTimeoutMillis,
    maxLifetimeSeconds,
    application_name: process.env.POWERCHAIN_DB_APPLICATION_NAME?.trim() || "powerchain-defai",
  });
  return new PrismaClient({ adapter });
}

/**
 * Returns the process-local Prisma client. Importing this module is side-effect free:
 * DATABASE_URL is required only when database access is actually attempted.
 */
export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.__powerchainPrisma) return globalForPrisma.__powerchainPrisma;
  const client = createPrismaClient();
  globalForPrisma.__powerchainPrisma = client;
  return client;
}

/**
 * Compatibility facade for existing call sites. Property access lazily resolves the
 * real Prisma client so Next.js can evaluate route modules during build without a
 * live database URL. Actual DB operations remain fail-closed through getPrismaClient().
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client) as unknown;
    return typeof value === "function" ? value.bind(client) : value;
  },
  has(_target, property) {
    return property in getPrismaClient();
  },
});

export type PrismaTransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;
export type PrismaJsonValue = Prisma.InputJsonValue;
export type PrismaBridgeTransferUpdateInput = Prisma.BridgeTransferUpdateInput;
