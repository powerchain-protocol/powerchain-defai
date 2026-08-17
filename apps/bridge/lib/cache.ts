type CacheEntry<T> = { value: T; expiresAt: number };
type CacheRead<T> = { hit: true; value: T } | { hit: false };

function normalizeTtlMs(ttlMs: number): number {
  if (!Number.isFinite(ttlMs)) return ttlMs === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : 250;
  return Math.max(250, Math.floor(ttlMs));
}

export class TTLCache<T> {
  private readonly values = new Map<string, CacheEntry<T>>();
  private readonly capacity: number;

  constructor(maxEntries = 100) {
    this.capacity = Number.isFinite(maxEntries) ? Math.max(1, Math.floor(maxEntries)) : 100;
  }

  get size(): number {
    this.pruneExpired();
    return this.values.size;
  }

  read(key: string): CacheRead<T> {
    const hit = this.values.get(key);
    if (!hit) return { hit: false };
    if (hit.expiresAt <= Date.now()) {
      this.values.delete(key);
      return { hit: false };
    }
    return { hit: true, value: hit.value };
  }

  get(key: string): T | undefined {
    const result = this.read(key);
    return result.hit ? result.value : undefined;
  }

  has(key: string): boolean {
    return this.read(key).hit;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.pruneExpired();
    if (this.values.size >= this.capacity && !this.values.has(key)) {
      const oldest = this.values.keys().next().value as string | undefined;
      if (oldest !== undefined) this.values.delete(oldest);
    }
    this.values.delete(key);
    const ttl = normalizeTtlMs(ttlMs);
    this.values.set(key, { value, expiresAt: ttl === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Date.now() + ttl });
  }

  delete(key: string): boolean {
    return this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.values) if (entry.expiresAt <= now) this.values.delete(key);
  }
}

const inflightByCache = new WeakMap<object, Map<string, Promise<unknown>>>();
function inflightMap(cache: object): Map<string, Promise<unknown>> {
  const current = inflightByCache.get(cache);
  if (current) return current;
  const next = new Map<string, Promise<unknown>>();
  inflightByCache.set(cache, next);
  return next;
}

export async function cachedAsync<T>(cache: TTLCache<T>, key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const cached = cache.read(key);
  if (cached.hit) return cached.value;

  const inflight = inflightMap(cache);
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const request = loader()
    .then((value) => {
      cache.set(key, value, ttlMs);
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, request);
  return request;
}
