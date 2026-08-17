export type ProviderChain = "solana" | "sui";
export type ProviderStatus = "healthy" | "degraded" | "unavailable";
export type ProviderRedundancy = "full" | "reduced" | "none";
export type ProviderDataSource = "network" | "cache" | "stale-cache" | "grpc";

export interface ProviderEndpointHealth {
  readonly id?: string;
  readonly circuit?: "closed" | "half-open" | "open";
  readonly healthy?: boolean;
}

export interface ProviderHealthItem {
  readonly provider: ProviderChain;
  readonly ok: boolean;
  readonly status: ProviderStatus;
  readonly latencyMs?: number;
  readonly head?: string;
  readonly stale?: boolean;
  readonly source?: ProviderDataSource;
  readonly error?: string;
  readonly endpoints?: ProviderEndpointHealth[];
}

export interface ProviderHealthPayload {
  readonly ok: boolean;
  readonly status: ProviderStatus;
  readonly checkedAt: string;
  readonly providers: ProviderHealthItem[];
}

export interface ProviderReadinessItem {
  readonly provider: ProviderChain;
  readonly ready: boolean;
  readonly redundancy: ProviderRedundancy;
  readonly latencyMs?: number;
  readonly head?: string;
  readonly configuredEndpoints?: number;
  readonly error?: string;
}

export interface ProviderReadinessPayload {
  readonly ready: boolean;
  readonly degraded?: boolean;
  readonly checkedAt: string;
  readonly redundancy?: ProviderRedundancy;
  readonly providers?: ProviderReadinessItem[];
}

export interface ProviderHookState<T> {
  readonly data?: T;
  readonly error?: string;
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly stale: boolean;
  readonly payloadAgeMs: number;
  readonly lastSuccessfulAt?: number;
  readonly online: boolean;
  readonly refresh: () => Promise<void>;
}
export interface ProviderDiagnosticEndpoint extends ProviderEndpointHealth {
  readonly id: string;
  readonly priority: number;
  readonly healthy: boolean;
  readonly circuit: "closed" | "half-open" | "open";
  readonly consecutiveFailures: number;
  readonly cooldownUntil: number;
  readonly activeRequests: number;
  readonly lastLatencyMs?: number;
  readonly ewmaLatencyMs?: number;
  readonly lastSuccessAt?: number;
  readonly lastFailureAt?: number;
  readonly successes: number;
  readonly failures: number;
}

export interface ProviderDiagnosticMetrics {
  readonly requests: number;
  readonly networkRequests: number;
  readonly cacheHits: number;
  readonly staleCacheHits: number;
  readonly dedupeHits: number;
  readonly rateLimited: number;
  readonly failures: number;
  readonly failovers: number;
  readonly active: number;
  readonly maxActive: number;
  readonly rejectedByConcurrency: number;
  readonly cacheEvictions: number;
  readonly cacheInvalidations: number;
  readonly budgetTimeouts: number;
  readonly quorumChecks: number;
  readonly quorumDisagreements: number;
  readonly hedgedRequests: number;
  readonly hedgeFallbackWins: number;
}

export interface ProviderDiagnosticChain {
  readonly status: ProviderStatus;
  readonly ok: boolean;
  readonly latencyMs?: number;
  readonly head?: string;
  readonly source?: ProviderDataSource;
  readonly endpoints: readonly ProviderDiagnosticEndpoint[];
  readonly metrics: ProviderDiagnosticMetrics;
}

export interface ProviderDiagnosticsPayload {
  readonly available: boolean;
  readonly generatedAt: string;
  readonly processLocal: true;
  readonly authoritativeForAccounting: false;
  readonly chains: {
    readonly solana: ProviderDiagnosticChain;
    readonly sui: ProviderDiagnosticChain;
  };
}

