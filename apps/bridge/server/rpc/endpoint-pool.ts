export type RpcEndpointConfig = {
  id: string;
  url: string;
  priority?: number;
};

export type RpcCircuitState = "closed" | "open" | "half-open";

export type RpcEndpointSnapshot = {
  id: string;
  priority: number;
  healthy: boolean;
  circuit: RpcCircuitState;
  consecutiveFailures: number;
  cooldownUntil: number;
  activeRequests: number;
  lastLatencyMs?: number;
  ewmaLatencyMs?: number;
  lastSuccessAt?: number;
  lastFailureAt?: number;
  successes: number;
  failures: number;
};

export type RpcPoolSnapshot = {
  globalCooldownRemainingMs: number;
  endpoints: RpcEndpointSnapshot[];
};

type EndpointState = Omit<RpcEndpointSnapshot, "circuit"> & { url: string };

const CIRCUIT_FAILURE_THRESHOLD = 3;
const RATE_LIMIT_COOLDOWN_MS = 10_000;
const EWMA_ALPHA = 0.25;

export class RpcEndpointPool {
  private readonly endpoints: EndpointState[];
  private globalCooldownUntil = 0;

  constructor(configs: readonly RpcEndpointConfig[]) {
    const unique = new Map<string, RpcEndpointConfig>();
    for (const config of configs) {
      const value = config.url.trim();
      if (!value) continue;
      const parsed = new URL(value);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error(`RPC endpoint ${config.id} must use http(s)`);
      if (!unique.has(value)) unique.set(value, { ...config, url: value });
    }
    this.endpoints = [...unique.values()].map((entry, index) => ({
      id: entry.id,
      url: entry.url,
      priority: entry.priority ?? index,
      healthy: true,
      consecutiveFailures: 0,
      cooldownUntil: 0,
      activeRequests: 0,
      successes: 0,
      failures: 0,
    }));
    if (!this.endpoints.length) throw new Error("At least one RPC endpoint is required");
  }

  candidates(now = Date.now()) {
    if (this.globalCooldownUntil > now) return [];
    return [...this.endpoints]
      .filter((endpoint) => endpoint.cooldownUntil <= now)
      .sort((a, b) => {
        if (a.healthy !== b.healthy) return a.healthy ? -1 : 1;
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.activeRequests !== b.activeRequests) return a.activeRequests - b.activeRequests;
        return (a.ewmaLatencyMs ?? a.lastLatencyMs ?? Number.MAX_SAFE_INTEGER)
          - (b.ewmaLatencyMs ?? b.lastLatencyMs ?? Number.MAX_SAFE_INTEGER);
      });
  }

  begin(id: string) {
    const endpoint = this.endpoints.find((item) => item.id === id);
    if (endpoint) endpoint.activeRequests += 1;
  }

  end(id: string) {
    const endpoint = this.endpoints.find((item) => item.id === id);
    if (endpoint) endpoint.activeRequests = Math.max(0, endpoint.activeRequests - 1);
  }

  success(id: string, latencyMs: number, now = Date.now()) {
    const endpoint = this.endpoints.find((item) => item.id === id);
    if (!endpoint) return;
    endpoint.healthy = true;
    endpoint.consecutiveFailures = 0;
    endpoint.cooldownUntil = 0;
    endpoint.lastLatencyMs = Math.max(0, Math.round(latencyMs));
    endpoint.ewmaLatencyMs = endpoint.ewmaLatencyMs === undefined
      ? endpoint.lastLatencyMs
      : Math.round(endpoint.ewmaLatencyMs * (1 - EWMA_ALPHA) + endpoint.lastLatencyMs * EWMA_ALPHA);
    endpoint.lastSuccessAt = now;
    endpoint.successes += 1;
  }

  failure(id: string, now = Date.now(), rateLimited = false) {
    const endpoint = this.endpoints.find((item) => item.id === id);
    if (!endpoint) return;
    endpoint.consecutiveFailures += 1;
    endpoint.failures += 1;
    endpoint.lastFailureAt = now;
    const exponential = Math.min(500 * 2 ** Math.min(endpoint.consecutiveFailures - 1, 6), 30_000);
    const circuitFloor = endpoint.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD ? 5_000 : 0;
    const base = rateLimited ? RATE_LIMIT_COOLDOWN_MS : Math.max(exponential, circuitFloor);
    endpoint.cooldownUntil = now + base;
    if (rateLimited) this.globalCooldownUntil = Math.max(this.globalCooldownUntil, now + RATE_LIMIT_COOLDOWN_MS);
    endpoint.healthy = endpoint.consecutiveFailures < CIRCUIT_FAILURE_THRESHOLD;
  }

  poolCooldownRemainingMs(now = Date.now()) {
    return Math.max(0, this.globalCooldownUntil - now);
  }

  snapshot(): RpcEndpointSnapshot[] {
    const now = Date.now();
    return this.endpoints.map(({ url: _url, ...endpoint }) => {
      const remaining = Math.max(0, endpoint.cooldownUntil - now);
      const circuit: RpcCircuitState = endpoint.healthy ? "closed" : remaining > 0 ? "open" : "half-open";
      return { ...endpoint, circuit, cooldownUntil: remaining };
    });
  }

  poolSnapshot(): RpcPoolSnapshot {
    return { globalCooldownRemainingMs: this.poolCooldownRemainingMs(), endpoints: this.snapshot() };
  }
}
