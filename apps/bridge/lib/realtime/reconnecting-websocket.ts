"use client";

export type ReconnectingWebSocketOptions = {
  minDelayMs?: number;
  maxDelayMs?: number;
  heartbeatMs?: number;
  heartbeatTimeoutMs?: number;
  maxReconnectAttempts?: number;
  protocols?: string | string[];
  maxMessageBytes?: number;
  maxMessagesPerSecond?: number;
};

export type RealtimeState = "idle" | "connecting" | "open" | "closed" | "exhausted";
export type RealtimeStats = {
  state: RealtimeState;
  connectionAttempts: number;
  reconnects: number;
  messages: number;
  heartbeatsSent: number;
  pongsReceived: number;
  heartbeatTimeouts: number;
  oversizedMessages: number;
  rateLimitedMessages: number;
  lastOpenAt?: number;
  lastMessageAt?: number;
  lastCloseAt?: number;
  lastPongAt?: number;
  endpointIndex: number;
  endpointCount: number;
};

export class ReconnectingWebSocket {
  private socket: WebSocket | undefined;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  private heartbeatDeadline: ReturnType<typeof setTimeout> | undefined;
  private attempt = 0;
  private stopped = false;
  private state: RealtimeState = "idle";
  private connectionAttempts = 0;
  private reconnects = 0;
  private messages = 0;
  private heartbeatsSent = 0;
  private pongsReceived = 0;
  private heartbeatTimeouts = 0;
  private oversizedMessages = 0;
  private rateLimitedMessages = 0;
  private messageWindowStartedAt = 0;
  private messageWindowCount = 0;
  private lastOpenAt: number | undefined;
  private lastMessageAt: number | undefined;
  private lastCloseAt: number | undefined;
  private lastPongAt: number | undefined;
  private readonly listeners = new Map<string, Set<(event: Event) => void>>();
  private endpointIndex = 0;
  private generation = 0;

  constructor(private readonly url: () => string | readonly string[], private readonly options: ReconnectingWebSocketOptions = {}) {}

  private urls() {
    const value = this.url();
    const candidates = (Array.isArray(value) ? value : [value]).map((item) => item.trim()).filter(Boolean);
    if (!candidates.length) throw new Error("REALTIME_WEBSOCKET_URL_REQUIRED");
    return [...new Set(candidates)];
  }

  private currentUrl() {
    const urls = this.urls();
    const index = this.endpointIndex % urls.length;
    return { url: urls[index]!, index, count: urls.length };
  }

  connect() {
    if (typeof window === "undefined" || this.stopped || this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) return;
    this.connectionAttempts += 1;
    this.emitState("connecting");
    const selected = this.currentUrl();
    const generation = ++this.generation;
    const socket = new WebSocket(selected.url, this.options.protocols);
    this.socket = socket;
    const active = () => generation === this.generation && socket === this.socket;
    socket.addEventListener("open", () => {
      if (!active()) return;
      this.attempt = 0;
      this.endpointIndex = selected.index;
      this.lastOpenAt = Date.now();
      this.emitState("open");
      this.startHeartbeat();
    });
    socket.addEventListener("message", (event) => {
      if (!active()) return;
      if (this.messageBytes(event.data) > this.maxMessageBytes()) {
        this.oversizedMessages += 1;
        socket.close(1009, "message too large");
        return;
      }
      if (!this.allowMessageNow()) {
        this.rateLimitedMessages += 1;
        socket.close(1013, "message rate exceeded");
        return;
      }
      this.messages += 1;
      this.lastMessageAt = Date.now();
      if (this.isPong(event.data)) this.acknowledgePong();
      else this.acknowledgeHeartbeatActivity();
      this.dispatch("message", event);
    });
    socket.addEventListener("error", (event) => { if (active()) this.dispatch("error", event); });
    socket.addEventListener("close", (event) => {
      if (!active()) return;
      this.stopHeartbeat();
      this.lastCloseAt = Date.now();
      this.dispatch("close", event);
      this.emitState("closed");
      if (!this.stopped) this.scheduleReconnect();
    });
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;
    this.socket.send(data);
    return true;
  }

  addEventListener(type: "message" | "error" | "close" | "state", listener: (event: Event) => void) {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
    return () => set.delete(listener);
  }

  stats(): RealtimeStats {
    return {
      state: this.state, connectionAttempts: this.connectionAttempts, reconnects: this.reconnects, messages: this.messages,
      heartbeatsSent: this.heartbeatsSent, pongsReceived: this.pongsReceived, heartbeatTimeouts: this.heartbeatTimeouts, oversizedMessages: this.oversizedMessages, rateLimitedMessages: this.rateLimitedMessages,
      ...(this.lastOpenAt === undefined ? {} : { lastOpenAt: this.lastOpenAt }),
      ...(this.lastMessageAt === undefined ? {} : { lastMessageAt: this.lastMessageAt }),
      ...(this.lastCloseAt === undefined ? {} : { lastCloseAt: this.lastCloseAt }),
      ...(this.lastPongAt === undefined ? {} : { lastPongAt: this.lastPongAt }),
      endpointIndex: this.currentUrl().index,
      endpointCount: this.currentUrl().count,
    };
  }

  close(code = 1000, reason = "client closed") {
    this.stopped = true;
    this.generation += 1;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
    this.stopHeartbeat();
    this.socket?.close(code, reason);
    this.socket = undefined;
    this.emitState("closed");
  }

  restart() {
    this.stopped = false;
    this.generation += 1;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
    this.stopHeartbeat();
    this.socket?.close(1000, "restart");
    this.socket = undefined;
    this.connect();
  }

  private scheduleReconnect() {
    const maxAttempts = this.options.maxReconnectAttempts ?? Number.POSITIVE_INFINITY;
    if (this.attempt >= maxAttempts) {
      this.stopped = true;
      this.emitState("exhausted");
      return;
    }
    this.endpointIndex = (this.endpointIndex + 1) % this.urls().length;
    const min = Math.max(250, this.options.minDelayMs ?? 750);
    const max = Math.max(min, this.options.maxDelayMs ?? 30_000);
    const delay = Math.min(max, min * 2 ** Math.min(this.attempt++, 6));
    const jitter = Math.round(delay * (0.8 + Math.random() * 0.4));
    this.reconnects += 1;
    const generation = this.generation;
    this.retryTimer = setTimeout(() => {
      if (generation !== this.generation || this.stopped) return;
      this.connect();
    }, jitter);
  }

  private startHeartbeat() {
    const every = this.options.heartbeatMs ?? 0;
    if (every <= 0) return;
    const sendHeartbeat = () => {
      if (!this.send(JSON.stringify({ type: "ping", at: Date.now() }))) return;
      this.heartbeatsSent += 1;
      this.armHeartbeatDeadline();
    };
    this.heartbeatTimer = setInterval(sendHeartbeat, every);
  }

  private armHeartbeatDeadline() {
    if (this.heartbeatDeadline) return; // only one outstanding ping may wait for pong.
    const timeout = Math.max(1_000, this.options.heartbeatTimeoutMs ?? Math.max(5_000, (this.options.heartbeatMs ?? 0) * 2));
    this.heartbeatDeadline = setTimeout(() => {
      this.heartbeatDeadline = undefined;
      this.heartbeatTimeouts += 1;
      this.socket?.close(4000, "heartbeat timeout");
    }, timeout);
  }

  private acknowledgePong() {
    this.pongsReceived += 1;
    this.lastPongAt = Date.now();
    if (this.heartbeatDeadline) clearTimeout(this.heartbeatDeadline);
    this.heartbeatDeadline = undefined;
  }

  private acknowledgeHeartbeatActivity() {
    // A valid application event proves the socket is alive even when an upstream
    // WebSocket service does not implement the optional application-level pong.
    if (this.heartbeatDeadline) clearTimeout(this.heartbeatDeadline);
    this.heartbeatDeadline = undefined;
  }

  private allowMessageNow(now = Date.now()) {
    const maxPerSecond = Math.max(10, Math.min(this.options.maxMessagesPerSecond ?? 200, 1_000));
    if (now - this.messageWindowStartedAt >= 1_000) {
      this.messageWindowStartedAt = now;
      this.messageWindowCount = 0;
    }
    this.messageWindowCount += 1;
    return this.messageWindowCount <= maxPerSecond;
  }

  private maxMessageBytes() {
    return Math.max(1_024, Math.min(this.options.maxMessageBytes ?? 256 * 1024, 1024 * 1024));
  }

  private messageBytes(data: unknown) {
    if (typeof data === "string") return new TextEncoder().encode(data).byteLength;
    if (data instanceof ArrayBuffer) return data.byteLength;
    if (typeof Blob !== "undefined" && data instanceof Blob) return data.size;
    if (ArrayBuffer.isView(data)) return data.byteLength;
    return 0;
  }

  private isPong(data: unknown) {
    if (typeof data !== "string") return false;
    try { const parsed = JSON.parse(data) as { type?: unknown }; return parsed.type === "pong"; }
    catch { return data.trim().toLowerCase() === "pong"; }
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.heartbeatDeadline) clearTimeout(this.heartbeatDeadline);
    this.heartbeatTimer = undefined;
    this.heartbeatDeadline = undefined;
  }

  private dispatch(type: string, event: Event) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }

  private emitState(state: RealtimeState) {
    this.state = state;
    const event = new CustomEvent("state", { detail: state });
    this.dispatch("state", event);
  }
}
