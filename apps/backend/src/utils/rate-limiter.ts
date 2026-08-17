type Bucket = { count: number; resetAt: number; touchedAt: number };

const buckets = new Map<string, Bucket>();
const DEFAULT_MAX_BUCKETS = 10_000;
const PRUNE_INTERVAL = 256;
let operations = 0;

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function maxBuckets(): number {
  return boundedInteger(process.env.POWERCHAIN_RATE_LIMIT_MAX_BUCKETS, DEFAULT_MAX_BUCKETS, 1_000, 100_000);
}

function prune(now: number, force = false): void {
  operations += 1;
  if (!force && operations % PRUNE_INTERVAL !== 0 && buckets.size <= maxBuckets()) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  const maximum = maxBuckets();
  if (buckets.size <= maximum) return;

  // Evict least-recently-touched buckets first. This bounds memory even when an
  // attacker continuously supplies new pseudonymous client keys.
  const overflow = buckets.size - maximum;
  const oldest = [...buckets.entries()]
    .sort((left, right) => left[1].touchedAt - right[1].touchedAt)
    .slice(0, overflow);
  for (const [key] of oldest) buckets.delete(key);
}

export type RateLimitResult = Readonly<{
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
  resetAt: number;
}>;

export function consumeRateLimit(key: string, limit = 60, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  prune(now);

  const safeLimit = Math.max(1, Math.floor(limit));
  const safeWindowMs = Math.max(1_000, Math.floor(windowMs));
  const existing = buckets.get(key);
  const bucket = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + safeWindowMs, touchedAt: now }
    : existing;

  bucket.touchedAt = now;
  if (bucket.count >= safeLimit) {
    buckets.set(key, bucket);
    return {
      ok: false,
      limit: safeLimit,
      remaining: 0,
      retryAfterMs: Math.max(0, bucket.resetAt - now),
      resetAt: bucket.resetAt,
    };
  }

  bucket.count += 1;
  buckets.set(key, bucket);
  return {
    ok: true,
    limit: safeLimit,
    remaining: Math.max(0, safeLimit - bucket.count),
    retryAfterMs: 0,
    resetAt: bucket.resetAt,
  };
}

/** Process-local operational diagnostics only; never use as billing or settlement evidence. */
export function rateLimiterDiagnostics() {
  const now = Date.now();
  prune(now, true);
  return Object.freeze({
    bucketCount: buckets.size,
    maxBuckets: maxBuckets(),
    pruneInterval: PRUNE_INTERVAL,
  });
}
