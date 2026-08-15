import { PrismaPg } from "@prisma/adapter-pg";
import { parseBoundedInteger } from "@powerchain/runtime";
import { Prisma, PrismaClient } from "./generated/prisma/client";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) throw new Error("DATABASE_URL_REQUIRED");

const poolMax = parseBoundedInteger(process.env.POWERCHAIN_DB_POOL_MAX, 10, { min: 1, max: 50 });
const connectionTimeoutMillis = parseBoundedInteger(process.env.POWERCHAIN_DB_CONNECT_TIMEOUT_MS, 5_000, { min: 1_000, max: 30_000 });
const idleTimeoutMillis = parseBoundedInteger(process.env.POWERCHAIN_DB_IDLE_TIMEOUT_MS, 300_000, { min: 1_000, max: 900_000 });
const maxLifetimeSeconds = parseBoundedInteger(process.env.POWERCHAIN_DB_MAX_LIFETIME_SECONDS, 0, { min: 0, max: 86_400 });

const globalForPrisma = globalThis as unknown as { __powerchainPrisma?: PrismaClient };
const adapter = new PrismaPg({
  connectionString,
  max: poolMax,
  connectionTimeoutMillis,
  idleTimeoutMillis,
  maxLifetimeSeconds,
  application_name: process.env.POWERCHAIN_DB_APPLICATION_NAME?.trim() || "powerchain-bridge",
});
export const prisma = globalForPrisma.__powerchainPrisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.__powerchainPrisma = prisma;

export type PrismaTransactionClient = Prisma.TransactionClient;
export type PrismaJsonValue = Prisma.InputJsonValue;
