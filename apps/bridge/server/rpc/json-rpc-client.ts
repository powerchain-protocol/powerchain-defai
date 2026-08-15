import "server-only";
import { RpcEndpointPool } from "./endpoint-pool";
import { assertRpcMethodOptions, classifyRpcMethod, rpcMethodAllowsFailover, rpcMethodAllowsHedging, rpcMethodAllowsQuorum } from "./rpc-method-policy";

export type JsonRpcRequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  idempotent?: boolean;
  cacheTtlMs?: number;
  staleIfErrorMs?: number;
  dedupe?: boolean;
  hedgeAfterMs?: number;
  requestBudgetMs?: number;
};

export type JsonRpcMeta = {
  source: "network" | "cache" | "stale-cache";
  stale: boolean;
  endpointId?: string;
  failoverCount: number;
};

export type JsonRpcResult<T> = { value: T; meta: JsonRpcMeta };
export type JsonRpcMetrics = {
  requests: number;
  networkRequests: number;
  cacheHits: number;
  staleCacheHits: number;
  dedupeHits: number;
  rateLimited: number;
  failures: number;
  failovers: number;
  active: number;
  maxActive: number;
  rejectedByConcurrency: number;
  cacheEvictions: number;
  cacheInvalidations: number;
  budgetTimeouts: number;
  quorumChecks: number;
  quorumDisagreements: number;
  hedgedRequests: number;
  hedgeFallbackWins: number;
};

type JsonRpcEnvelope<T> = { jsonrpc?: string; id?: number | string; result?: T; error?: { code?: number; message?: string; data?: unknown } };
type CacheEntry = { writtenAt: number; expiresAt: number; staleUntil: number; value: unknown };
type NetworkResult<T> = { value: T; endpointId: string; failoverCount: number };

const MAX_READ_CACHE_TTL_MS = 5_000;
const MAX_STALE_IF_ERROR_MS = 30_000;
const DEFAULT_MAX_CONCURRENCY = 32;
const MAX_CONCURRENCY_LIMIT = 128;
const DEFAULT_MAX_CACHE_ENTRIES = 512;
const MAX_CACHE_ENTRY_LIMIT = 2_048;
const MAX_REQUEST_BUDGET_MS = 30_000;

export class RpcUnavailableError extends Error {
  readonly attempts: string[];
  constructor(message: string, attempts: string[]) {
    super(message);
    this.name = "RpcUnavailableError";
    this.attempts = attempts;
  }
}

class RpcConcurrencyError extends Error {
  constructor() {
    super("RPC concurrency limit reached");
    this.name = "RpcConcurrencyError";
  }
}

function timeoutSignal(parent: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("RPC timeout")), timeoutMs);
  const abort = () => controller.abort(parent?.reason);
  parent?.addEventListener("abort", abort, { once: true });
  return { signal: controller.signal, cleanup: () => { clearTimeout(timer); parent?.removeEventListener("abort", abort); } };
}

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`;
}

function maxConcurrencyFromEnv() {
  const parsed = Number.parseInt(process.env.POWERCHAIN_RPC_MAX_CONCURRENCY ?? "", 10);
  if (!Number.isFinite(parsed)) return DEFAULT_MAX_CONCURRENCY;
  return Math.max(1, Math.min(parsed, MAX_CONCURRENCY_LIMIT));
}

export class JsonRpcClient {
  private id = 0;
  private readonly inflight = new Map<string, Promise<JsonRpcResult<unknown>>>();
  private readonly cache = new Map<string, CacheEntry>();
  private active = 0;
  private readonly maxConcurrency = maxConcurrencyFromEnv();
  private readonly counters: JsonRpcMetrics = {
    requests: 0, networkRequests: 0, cacheHits: 0, staleCacheHits: 0, dedupeHits: 0,
    rateLimited: 0, failures: 0, failovers: 0, active: 0, maxActive: 0, rejectedByConcurrency: 0,
    cacheEvictions: 0, cacheInvalidations: 0, budgetTimeouts: 0, quorumChecks: 0, quorumDisagreements: 0,
    hedgedRequests: 0, hedgeFallbackWins: 0,
  };

  constructor(private readonly pool: RpcEndpointPool) {}

  private maxCacheEntries() {
    const parsed = Number.parseInt(process.env.POWERCHAIN_RPC_MAX_CACHE_ENTRIES ?? "", 10);
    if (!Number.isFinite(parsed)) return DEFAULT_MAX_CACHE_ENTRIES;
    return Math.max(64, Math.min(parsed, MAX_CACHE_ENTRY_LIMIT));
  }

  clearReadCache() {
    const count = this.cache.size;
    this.cache.clear();
    this.counters.cacheInvalidations += count;
    return count;
  }

  invalidateRead(method: string, params?: unknown[] | object) {
    if (params !== undefined) {
      const deleted = this.cache.delete(`${method}:${stable(params)}`);
      if (deleted) this.counters.cacheInvalidations += 1;
      return deleted ? 1 : 0;
    }
    let deleted = 0;
    const prefix = `${method}:`;
    for (const key of [...this.cache.keys()]) {
      if (!key.startsWith(prefix)) continue;
      this.cache.delete(key);
      deleted += 1;
    }
    this.counters.cacheInvalidations += deleted;
    return deleted;
  }

  metrics(): JsonRpcMetrics {
    return { ...this.counters, active: this.active, maxActive: this.counters.maxActive };
  }

  async request<T>(method: string, params: unknown[] | object = [], options: JsonRpcRequestOptions = {}): Promise<T> {
    return (await this.requestWithMeta<T>(method, params, options)).value;
  }

  async requestWithMeta<T>(method: string, params: unknown[] | object = [], options: JsonRpcRequestOptions = {}): Promise<JsonRpcResult<T>> {
    this.counters.requests += 1;
    assertRpcMethodOptions(method, options.idempotent, options.cacheTtlMs, options.staleIfErrorMs);
    const safety = classifyRpcMethod(method);
    const canFailover = rpcMethodAllowsFailover(method, options.idempotent);
    const isRead = safety === "read" || (safety === "unknown" && options.idempotent === true);
    const cacheTtl = isRead ? Math.max(0, Math.min(options.cacheTtlMs ?? 0, MAX_READ_CACHE_TTL_MS)) : 0;
    const staleIfError = isRead ? Math.max(0, Math.min(options.staleIfErrorMs ?? 0, MAX_STALE_IF_ERROR_MS)) : 0;
    const key = `${method}:${stable(params)}`;
    const now = Date.now();
    const cached = this.cache.get(key);

    if (cacheTtl > 0 && cached?.expiresAt && cached.expiresAt > now) {
      this.counters.cacheHits += 1;
      return { value: cached.value as T, meta: { source: "cache", stale: false, failoverCount: 0 } };
    }

    // Caller-owned cancellation/budgets must not cancel a shared single-flight request.
    const dedupe = isRead && options.dedupe !== false && !options.signal && options.requestBudgetMs === undefined;
    const existing = dedupe ? this.inflight.get(key) : undefined;
    if (existing) {
      this.counters.dedupeHits += 1;
      return existing as Promise<JsonRpcResult<T>>;
    }

    const work = this.withConcurrency(async () => {
      const budget = this.requestBudget(options);
      try {
        const network = await this.requestNetwork<T>(method, params, { ...options, signal: budget.signal }, canFailover);
        if (cacheTtl > 0 || staleIfError > 0) {
          const writtenAt = Date.now();
          this.pruneCache(writtenAt);
          this.cache.set(key, {
            value: network.value,
            writtenAt,
            expiresAt: writtenAt + cacheTtl,
            staleUntil: writtenAt + cacheTtl + staleIfError,
          });
        }
        if (safety === "write") this.clearReadCache();
        return { value: network.value, meta: { source: "network", stale: false, endpointId: network.endpointId, failoverCount: network.failoverCount } };
      } catch (error) {
        const fallback = this.cache.get(key);
        if (staleIfError > 0 && fallback && fallback.staleUntil > Date.now()) {
          this.counters.staleCacheHits += 1;
          return { value: fallback.value as T, meta: { source: "stale-cache", stale: true, failoverCount: 0 } };
        }
        throw error;
      } finally {
        budget.cleanup();
      }
    });

    if (dedupe) this.inflight.set(key, work as Promise<JsonRpcResult<unknown>>);
    try {
      return await work;
    } finally {
      if (dedupe && this.inflight.get(key) === work) this.inflight.delete(key);
    }
  }

  async requestQuorum<T>(
    method: string,
    params: unknown[] | object = [],
    options: Omit<JsonRpcRequestOptions, "hedgeAfterMs" | "staleIfErrorMs"> = {},
    agree: (left: T, right: T) => boolean = (left, right) => stable(left) === stable(right),
  ): Promise<{ value: T; endpoints: [string, string] }> {
    if (!rpcMethodAllowsQuorum(method)) throw new Error(`RPC method ${method} is not approved for exact quorum checks`);
    this.counters.quorumChecks += 1;
    const candidates = this.pool.candidates();
    if (candidates.length < 2) throw new RpcUnavailableError(`RPC quorum requires two available endpoints for ${method}`, ["QUORUM_ENDPOINTS_UNAVAILABLE"]);
    const [a, b] = candidates;
    const [left, right] = await Promise.all([
      this.requestEndpoint<T>(a, method, params, options),
      this.requestEndpoint<T>(b, method, params, options),
    ]);
    if (!agree(left.value, right.value)) {
      this.counters.quorumDisagreements += 1;
      throw new RpcUnavailableError(`RPC quorum disagreement for ${method}`, [`${a.id}:DISAGREE`, `${b.id}:DISAGREE`]);
    }
    return { value: left.value, endpoints: [a.id, b.id] };
  }


  private requestBudget(options: JsonRpcRequestOptions) {
    const requested = options.requestBudgetMs;
    if (requested === undefined) return { signal: options.signal, cleanup: () => {} };
    const budgetMs = Math.max(500, Math.min(requested, MAX_REQUEST_BUDGET_MS));
    const controller = new AbortController();
    const timer = setTimeout(() => {
      this.counters.budgetTimeouts += 1;
      controller.abort(new Error("RPC request budget exhausted"));
    }, budgetMs);
    const abort = () => controller.abort(options.signal?.reason);
    options.signal?.addEventListener("abort", abort, { once: true });
    return {
      signal: controller.signal,
      cleanup: () => { clearTimeout(timer); options.signal?.removeEventListener("abort", abort); },
    };
  }

  private pruneCache(now = Date.now()) {
    for (const [key, entry] of this.cache) {
      if (entry.staleUntil <= now) { this.cache.delete(key); this.counters.cacheEvictions += 1; }
    }
    const maxEntries = this.maxCacheEntries();
    if (this.cache.size < maxEntries) return;
    const overflow = this.cache.size - maxEntries + 1;
    const oldest = [...this.cache.entries()].sort((a, b) => a[1].writtenAt - b[1].writtenAt).slice(0, overflow);
    for (const [key] of oldest) { this.cache.delete(key); this.counters.cacheEvictions += 1; }
  }

  private async withConcurrency<T>(work: () => Promise<T>) {
    if (this.active >= this.maxConcurrency) {
      this.counters.rejectedByConcurrency += 1;
      throw new RpcConcurrencyError();
    }
    this.active += 1;
    this.counters.maxActive = Math.max(this.counters.maxActive, this.active);
    try { return await work(); }
    finally { this.active -= 1; }
  }

  private async requestNetwork<T>(method: string, params: unknown[] | object, options: JsonRpcRequestOptions, canFailover: boolean): Promise<NetworkResult<T>> {
    const candidates = this.pool.candidates();
    const attempts: string[] = [];
    if (!candidates.length) throw new RpcUnavailableError("RPC pool is cooling down", ["POOL_COOLDOWN"]);
    const usable = canFailover ? candidates : candidates.slice(0, 1);
    const hedgeAfterMs = rpcMethodAllowsHedging(method, options.idempotent)
      ? Math.max(0, Math.min(options.hedgeAfterMs ?? 0, 2_000))
      : 0;

    if (hedgeAfterMs > 0 && usable.length > 1) {
      return this.requestHedged<T>(usable.slice(0, 2), method, params, options, hedgeAfterMs);
    }

    for (let index = 0; index < usable.length; index += 1) {
      const endpoint = usable[index];
      try {
        const result = await this.requestEndpoint<T>(endpoint, method, params, options);
        if (index > 0) this.counters.failovers += index;
        return { value: result.value, endpointId: endpoint.id, failoverCount: index };
      } catch (error) {
        attempts.push(`${endpoint.id}:${error instanceof Error ? error.name : "ERROR"}`);
        if (error instanceof RpcUnavailableError && error.attempts.includes("RATE_LIMITED")) break;
      }
    }
    this.counters.failures += 1;
    throw new RpcUnavailableError(`No RPC endpoint available for ${method}`, attempts);
  }

  private async requestHedged<T>(endpoints: ReturnType<RpcEndpointPool["candidates"]>, method: string, params: unknown[] | object, options: JsonRpcRequestOptions, hedgeAfterMs: number): Promise<NetworkResult<T>> {
    this.counters.hedgedRequests += 1;
    const primary = endpoints[0];
    const fallback = endpoints[1];
    const primaryController = new AbortController();
    const fallbackController = new AbortController();
    const parentAbort = () => { primaryController.abort(options.signal?.reason); fallbackController.abort(options.signal?.reason); };
    options.signal?.addEventListener("abort", parentAbort, { once: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const primaryPromise = this.requestEndpoint<T>(primary, method, params, { ...options, signal: primaryController.signal });
      const first = await Promise.race([
        primaryPromise.then(
          (value) => ({ kind: "primary-ok" as const, value }),
          (error) => ({ kind: "primary-error" as const, error }),
        ),
        new Promise<{ kind: "hedge" }>((resolve) => { timer = setTimeout(() => resolve({ kind: "hedge" }), hedgeAfterMs); }),
      ]);
      if (first.kind === "primary-ok") return { ...first.value, endpointId: primary.id, failoverCount: 0 };
      if (first.kind === "primary-error") {
        if (first.error instanceof RpcUnavailableError && first.error.attempts.includes("RATE_LIMITED")) throw first.error;
        const recovered = await this.requestEndpoint<T>(fallback, method, params, { ...options, signal: fallbackController.signal });
        this.counters.failovers += 1;
        this.counters.hedgeFallbackWins += 1;
        return { ...recovered, endpointId: fallback.id, failoverCount: 1 };
      }
      const fallbackPromise = this.requestEndpoint<T>(fallback, method, params, { ...options, signal: fallbackController.signal });
      const winner = await Promise.any([
        primaryPromise.then((value) => ({ ...value, endpointId: primary.id, failoverCount: 0 })),
        fallbackPromise.then((value) => ({ ...value, endpointId: fallback.id, failoverCount: 1 })),
      ]);
      if (winner.endpointId === primary.id) fallbackController.abort(new Error("hedge lost"));
      else { primaryController.abort(new Error("hedge lost")); this.counters.failovers += 1; this.counters.hedgeFallbackWins += 1; }
      return winner;
    } catch (error) {
      this.counters.failures += 1;
      throw new RpcUnavailableError(`Hedged RPC request failed for ${method}`, [error instanceof Error ? error.name : "HEDGE_FAILED"]);
    } finally {
      if (timer) clearTimeout(timer);
      options.signal?.removeEventListener("abort", parentAbort);
    }
  }

  private async requestEndpoint<T>(endpoint: ReturnType<RpcEndpointPool["candidates"]>[number], method: string, params: unknown[] | object, options: JsonRpcRequestOptions) {
    this.counters.networkRequests += 1;
    this.pool.begin(endpoint.id);
    const started = performance.now();
    const request = timeoutSignal(options.signal, Math.max(500, Math.min(options.timeoutMs ?? 8_000, 30_000)));
    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++this.id, method, params }),
        signal: request.signal,
        cache: "no-store",
      });
      if (!response.ok) {
        const rateLimited = response.status === 429;
        this.pool.failure(endpoint.id, Date.now(), rateLimited);
        if (rateLimited) {
          this.counters.rateLimited += 1;
          throw new RpcUnavailableError(`RPC ${endpoint.id} rate limited`, ["RATE_LIMITED"]);
        }
        throw new RpcUnavailableError(`RPC ${endpoint.id} returned HTTP ${response.status}`, [`HTTP_${response.status}`]);
      }
      const payload = (await response.json()) as JsonRpcEnvelope<T>;
      if (payload.error) {
        this.pool.success(endpoint.id, performance.now() - started);
        throw new Error(`RPC ${method} failed (${payload.error.code ?? "unknown"}): ${payload.error.message ?? "unknown error"}`);
      }
      if (!("result" in payload)) {
        this.pool.failure(endpoint.id);
        throw new RpcUnavailableError(`RPC ${endpoint.id} malformed response`, ["MALFORMED_RESPONSE"]);
      }
      this.pool.success(endpoint.id, performance.now() - started);
      return { value: payload.result as T };
    } catch (error) {
      if (options.signal?.aborted) throw error;
      if (error instanceof Error && error.message.startsWith(`RPC ${method} failed`)) throw error;
      if (error instanceof RpcUnavailableError) throw error; // HTTP/malformed paths already updated endpoint health.
      this.pool.failure(endpoint.id);
      throw error;
    } finally {
      request.cleanup();
      this.pool.end(endpoint.id);
    }
  }
}
