export type RealtimeTransport = "websocket" | "sse" | "polling";
export type RealtimeFallbackReason = "offline" | "websocket-unconfigured" | "websocket-exhausted" | "sse-unavailable" | "none";

export type TransportCapabilities = {
  websocketUrl?: string;
  websocketExhausted?: boolean;
  sseAvailable: boolean;
  online: boolean;
};

export type TransportDecision = { transport: RealtimeTransport; reason: RealtimeFallbackReason };

export function decideRealtimeTransport(capabilities: TransportCapabilities): TransportDecision {
  if (!capabilities.online) return { transport: "polling", reason: "offline" };
  if (capabilities.websocketUrl?.trim() && !capabilities.websocketExhausted) return { transport: "websocket", reason: "none" };
  if (capabilities.sseAvailable) return { transport: "sse", reason: capabilities.websocketUrl ? "websocket-exhausted" : "websocket-unconfigured" };
  return { transport: "polling", reason: "sse-unavailable" };
}

export function chooseRealtimeTransport(capabilities: TransportCapabilities): RealtimeTransport {
  return decideRealtimeTransport(capabilities).transport;
}

function validRealtimeUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.username || url.password) return undefined;
    if (url.protocol !== "wss:" && !(process.env.NODE_ENV !== "production" && url.protocol === "ws:")) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function publicRealtimeUrls() {
  const values = [
    process.env.NEXT_PUBLIC_POWERCHAIN_REALTIME_WS_URL,
    process.env.NEXT_PUBLIC_POWERCHAIN_REALTIME_WS_FALLBACK_URL,
    ...(process.env.NEXT_PUBLIC_POWERCHAIN_REALTIME_WS_FALLBACK_URLS ?? "").split(","),
  ];
  const result: string[] = [];
  for (const raw of values) {
    const normalized = raw?.trim() ? validRealtimeUrl(raw.trim()) : undefined;
    if (normalized && !result.includes(normalized)) result.push(normalized);
  }
  return result;
}

export function publicRealtimeUrl() {
  return publicRealtimeUrls()[0];
}

export function transferRealtimeUrl(base: string, transferId: string, cursor?: string | null) {
  const url = new URL(base);
  const prefix = url.pathname.replace(/\/$/, "");
  url.pathname = `${prefix}/v1/bridge/transfers/${encodeURIComponent(transferId)}/events`;
  url.search = "";
  if (cursor) url.searchParams.set("cursor", cursor);
  return url.toString();
}

function boundedNumber(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(minimum, Math.min(Math.floor(parsed), maximum)) : fallback;
}

export function publicRealtimeSocketOptions() {
  const reconnectMs = boundedNumber(process.env.NEXT_PUBLIC_POWERCHAIN_WS_RECONNECT_INTERVAL, 5_000, 250, 30_000);
  const heartbeatMs = boundedNumber(process.env.NEXT_PUBLIC_POWERCHAIN_WS_HEARTBEAT_INTERVAL, 30_000, 5_000, 120_000);
  return {
    minDelayMs: Math.max(250, Math.min(reconnectMs, 5_000)),
    maxDelayMs: Math.max(reconnectMs, 8_000),
    heartbeatMs,
    heartbeatTimeoutMs: Math.max(5_000, Math.min(heartbeatMs * 2, 120_000)),
    maxReconnectAttempts: 3,
  } as const;
}
