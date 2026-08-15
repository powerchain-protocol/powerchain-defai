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

export function publicRealtimeUrl() {
  const value = process.env.NEXT_PUBLIC_POWERCHAIN_REALTIME_WS_URL?.trim();
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.username || url.password) return undefined;
    if (url.protocol !== "wss:" && !(process.env.NODE_ENV !== "production" && url.protocol === "ws:")) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function transferRealtimeUrl(base: string, transferId: string, cursor?: string | null) {
  const url = new URL(base);
  const prefix = url.pathname.replace(/\/$/, "");
  url.pathname = `${prefix}/v1/bridge/transfers/${encodeURIComponent(transferId)}/events`;
  url.search = "";
  if (cursor) url.searchParams.set("cursor", cursor);
  return url.toString();
}
