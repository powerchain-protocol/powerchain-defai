export { prisma } from "./prisma";

export async function heartbeatWorker(input: { workerId: string; workerType: string; version: string; startedAt: Date }) {
  const { prisma } = await import("./prisma");
  return prisma.workerHeartbeat.upsert({
    where: { workerId: input.workerId },
    create: { workerId: input.workerId, workerType: input.workerType, version: input.version, startedAt: input.startedAt, heartbeatAt: new Date() },
    update: { workerType: input.workerType, version: input.version, heartbeatAt: new Date() },
  });
}

export async function removeWorkerHeartbeat(workerId: string) {
  const { prisma } = await import("./prisma");
  await prisma.workerHeartbeat.deleteMany({ where: { workerId } });
}

export async function checkDatabaseReady() {
  const { prisma } = await import("./prisma");
  await prisma.$queryRaw`SELECT 1`;
  return true;
}

export async function closeDatabase() {
  const { prisma } = await import("./prisma");
  await prisma.$disconnect();
}


export async function getWorkerReadiness(input: { requiredTypes?: string[]; maxAgeMs?: number } = {}) {
  const { prisma } = await import("./prisma");
  const requiredTypes = input.requiredTypes ?? ["claims", "fees"];
  const maxAgeMs = Math.max(5_000, Math.min(300_000, input.maxAgeMs ?? 60_000));
  const rows = await prisma.workerHeartbeat.findMany({
    where: { workerType: { in: requiredTypes } },
    orderBy: { heartbeatAt: "desc" },
    select: { workerType: true, version: true, heartbeatAt: true },
  });
  const now = Date.now();
  const latest = new Map<string, { workerType: string; version: string; heartbeatAt: Date }>();
  for (const row of rows) if (!latest.has(row.workerType)) latest.set(row.workerType, row);
  const workers = requiredTypes.map((type) => {
    const row = latest.get(type);
    const ageMs = row ? Math.max(0, now - row.heartbeatAt.getTime()) : null;
    return {
      type,
      ready: ageMs !== null && ageMs <= maxAgeMs,
      ageMs,
      heartbeatAt: row?.heartbeatAt.toISOString() ?? null,
      version: row?.version ?? null,
    };
  });
  return { ready: workers.every((worker) => worker.ready), maxAgeMs, workers };
}


function isRetriableTransactionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error && typeof (error as { code?: unknown }).code === "string" ? (error as { code: string }).code : "";
  return code === "P2034" || code === "40001" || code === "40P01";
}

export async function retrySerializableTransaction<T>(
  run: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const maxAttempts = Math.max(1, Math.min(5, options.maxAttempts ?? 3));
  const baseDelayMs = Math.max(10, Math.min(500, options.baseDelayMs ?? 40));
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (!isRetriableTransactionError(error) || attempt === maxAttempts) throw error;
      const delay = Math.min(1_000, baseDelayMs * 2 ** (attempt - 1));
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("POWERCHAIN_TRANSACTION_RETRY_EXHAUSTED");
}
