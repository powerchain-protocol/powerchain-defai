import { randomInt } from "node:crypto";

const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve) => {
  if (signal?.aborted) return resolve();
  const timer = setTimeout(resolve, ms);
  timer.unref?.();
  signal?.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
});

export function parseBoundedInteger(value: string | undefined, fallback: number, bounds: { min: number; max: number }): number {
  const parsed = value == null || value.trim() === "" ? fallback : Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return fallback;
  return Math.max(bounds.min, Math.min(bounds.max, parsed));
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw signal.reason instanceof Error ? signal.reason : new Error("POWERCHAIN_OPERATION_ABORTED");
}

export interface SupervisedWorkerContext { signal: AbortSignal; iteration: number }

class WorkerTickTimeoutError extends Error {
  constructor(worker: string, timeoutMs: number) {
    super(`POWERCHAIN_WORKER_TICK_TIMEOUT:${worker}:${timeoutMs}`);
    this.name = "WorkerTickTimeoutError";
  }
}

async function runTickWithTimeout(input: {
  worker: string;
  timeoutMs: number;
  signal: AbortSignal;
  run: () => Promise<void>;
}): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new WorkerTickTimeoutError(input.worker, input.timeoutMs)), input.timeoutMs);
    timer.unref?.();
  });
  try {
    await Promise.race([input.run(), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function runSupervisedWorker(input: {
  name: string;
  idleMs: number;
  maxBackoffMs: number;
  tickTimeoutMs?: number;
  shutdownTimeoutMs?: number;
  run: (context: SupervisedWorkerContext) => Promise<void>;
  cleanup?: () => Promise<void>;
}) {
  const controller = new AbortController();
  let failures = 0;
  let iteration = 0;
  const tickTimeoutMs = Math.max(1_000, input.tickTimeoutMs ?? 120_000);
  const shutdownTimeoutMs = Math.max(1_000, input.shutdownTimeoutMs ?? 15_000);
  const stop = () => controller.abort(new Error("POWERCHAIN_WORKER_SHUTDOWN"));
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    while (!controller.signal.aborted) {
      iteration += 1;
      const tickController = new AbortController();
      const abortTick = () => tickController.abort(controller.signal.reason ?? new Error("POWERCHAIN_WORKER_SHUTDOWN"));
      controller.signal.addEventListener("abort", abortTick, { once: true });
      try {
        await runTickWithTimeout({
          worker: input.name,
          timeoutMs: tickTimeoutMs,
          signal: tickController.signal,
          run: () => input.run({ signal: tickController.signal, iteration }),
        });
        throwIfAborted(tickController.signal);
        failures = 0;
        if (!controller.signal.aborted) await sleep(Math.max(250, input.idleMs), controller.signal);
      } catch (error) {
        if (error instanceof WorkerTickTimeoutError) {
          tickController.abort(error);
          // Unknown in-flight work must never overlap with another tick. Shut down
          // fail-closed and rely on persisted leases/recovery on the next process.
          controller.abort(error);
          console.error("POWERCHAIN_WORKER_TICK_TIMEOUT", { worker: input.name, iteration, timeoutMs: tickTimeoutMs });
          continue;
        }
        if (controller.signal.aborted) continue;
        failures += 1;
        const base = Math.min(input.maxBackoffMs, 1_000 * 2 ** Math.min(failures - 1, 6));
        const jitter = randomInt(0, Math.max(2, Math.floor(base * 0.1) + 1));
        const backoff = Math.min(input.maxBackoffMs, base + jitter);
        console.error("POWERCHAIN_WORKER_TICK_FAILED", { worker: input.name, iteration, failures, backoff, error: error instanceof Error ? error.message : String(error) });
        await sleep(backoff, controller.signal);
      } finally {
        controller.signal.removeEventListener("abort", abortTick);
      }
    }
  } finally {
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
    if (input.cleanup) {
      await Promise.race([
        input.cleanup(),
        sleep(shutdownTimeoutMs).then(() => { throw new Error("POWERCHAIN_WORKER_CLEANUP_TIMEOUT"); }),
      ]).catch((error) => console.error("POWERCHAIN_WORKER_CLEANUP_FAILED", { worker: input.name, error: error instanceof Error ? error.message : String(error) }));
    }
  }
}
