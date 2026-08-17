"use client";
import { apiFetch } from "@/lib/api/browser-api";
import { useUserSettings } from "@/context/user-settings-context";

import { useCallback, useEffect, useRef, useState } from "react";
import { isTerminalTransferStatus, normalizeTransferStatus } from "../lib/bridge/transfer-status";
import { useNetworkOnline } from "./use-network-online";
import { ReconnectingWebSocket } from "../lib/realtime/reconnecting-websocket";
import { publicRealtimeSocketOptions, publicRealtimeUrls, transferRealtimeUrl } from "../lib/realtime/transport-policy";

export type TransferEvent = { id: string; status?: string; createdAt?: string; [key: string]: unknown };
export type TransferStatusSnapshot = { transferId: string; status: string; version?: number; events?: TransferEvent[] };
type Envelope<T> = { data?: T };

const MAX_EVENTS = 200;
const POLL_TIMEOUT_MS = 10_000;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function normalizeEvent(value: unknown): TransferEvent | null {
  const record = asRecord(value);
  if (!record || typeof record.id !== "string" || !record.id.trim()) return null;
  const event: TransferEvent = { ...record, id: record.id.trim() };
  if (record.status != null) event.status = normalizeTransferStatus(record.status);
  if (typeof record.createdAt === "string") event.createdAt = record.createdAt;
  return event;
}

function normalizeSnapshot(value: unknown, expectedTransferId: string): TransferStatusSnapshot | null {
  const record = asRecord(value);
  if (!record) return null;
  const responseTransferId = typeof record.transferId === "string" ? record.transferId : expectedTransferId;
  if (responseTransferId !== expectedTransferId) return null;
  const events = Array.isArray(record.events) ? record.events.map(normalizeEvent).filter((event): event is TransferEvent => event != null) : [];
  const statusFromEvents = events.at(-1)?.status;
  const status = normalizeTransferStatus(record.status ?? statusFromEvents ?? "CREATED");
  const version = typeof record.version === "number" && Number.isSafeInteger(record.version) && record.version >= 0 ? record.version : undefined;
  return { transferId: expectedTransferId, status, ...(version === undefined ? {} : { version }), events };
}

export function useTransferStatus(transferId: string | null | undefined) {
  const online = useNetworkOnline();
  const { settings } = useUserSettings();
  const pollIntervalMs = settings.bridge.statusPollMs;
  const realtimeAllowed = settings.bridge.preferRealtime && !(settings.connectivity.useCustomApi && settings.connectivity.apiBaseUrl.trim());
  const [snapshot, setSnapshot] = useState<TransferStatusSnapshot | null>(null);
  const [connection, setConnection] = useState<"idle" | "live" | "polling" | "offline" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const cursor = useRef<string | null>(null);
  const manualRefresh = useRef<(() => Promise<void>) | null>(null);
  const terminalRef = useRef(false);
  const connectionRef = useRef<"idle" | "live" | "polling" | "offline" | "error">("idle");

  const refresh = useCallback(async () => { await manualRefresh.current?.(); }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 5_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    cursor.current = null;
    setSnapshot(null);
    setError(null);
    setLastUpdatedAt(null);
    setClock(Date.now());
    if (!transferId) {
      setConnection("idle");
      connectionRef.current = "idle";
      terminalRef.current = false;
      manualRefresh.current = null;
      return;
    }

    terminalRef.current = false;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stream: EventSource | undefined;
    let websocket: ReconnectingWebSocket | undefined;
    let pollAbort: AbortController | undefined;
    let polling = false;

    const setConn = (value: "idle" | "live" | "polling" | "offline" | "error") => {
      setConnection(value);
      connectionRef.current = value;
    };

    const apply = (candidate: unknown) => {
      if (stopped) return false;
      const data = normalizeSnapshot(candidate, transferId);
      if (!data) return false;
      setSnapshot((previous) => {
        const merged = [...(previous?.events ?? []), ...(data.events ?? [])];
        const seen = new Set<string>();
        const events = merged.filter((event) => event.id && !seen.has(event.id) && Boolean(seen.add(event.id))).slice(-MAX_EVENTS);
        return { ...previous, ...data, events };
      });
      const last = data.events?.at(-1)?.id;
      if (last) cursor.current = last;
      const now = Date.now();
      setLastUpdatedAt(now);
      setClock(now);
      setError(null);
      terminalRef.current = isTerminalTransferStatus(data.status);
      if (terminalRef.current) {
        stream?.close();
        websocket?.close(1000, "terminal");
        websocket = undefined;
        if (timer) clearTimeout(timer);
      }
      return true;
    };

    const schedule = () => {
      if (stopped || terminalRef.current || !navigator.onLine) return;
      if (timer) clearTimeout(timer);
      const delay = document.visibilityState === "hidden" ? Math.max(15_000, pollIntervalMs) : pollIntervalMs;
      timer = setTimeout(() => void poll(), delay);
    };

    const poll = async (manual = false) => {
      if (stopped || polling || terminalRef.current) return;
      if (!navigator.onLine) { setConn("offline"); return; }
      const preserveLive = manual && connectionRef.current === "live";
      polling = true;
      if (!preserveLive) setConn("polling");
      pollAbort?.abort();
      const abort = new AbortController();
      pollAbort = abort;
      const timeout = window.setTimeout(() => abort.abort("timeout"), POLL_TIMEOUT_MS);
      try {
        const qs = cursor.current ? `?cursor=${encodeURIComponent(cursor.current)}&limit=50` : "?limit=50";
        const response = await apiFetch(`/api/v1/bridge/transfers/${encodeURIComponent(transferId)}/events${qs}`, {
          cache: "no-store",
          headers: { accept: "application/json" },
          signal: abort.signal,
        });
        if (!response.ok) throw new Error(`Transfer status unavailable (${response.status})`);
        const payload = (await response.json()) as Envelope<unknown>;
        if (payload.data && !apply(payload.data)) throw new Error("Transfer status response did not match this transfer");
      } catch (cause) {
        if (!stopped && !abort.signal.aborted) {
          setConn("error");
          setError(cause instanceof Error ? cause.message : "Transfer status unavailable");
        } else if (!stopped && abort.signal.aborted && navigator.onLine) {
          setConn("error");
          setError("Transfer status request timed out. Retrying automatically.");
        }
      } finally {
        window.clearTimeout(timeout);
        polling = false;
        if (preserveLive && !terminalRef.current) setConn("live");
        else schedule();
      }
    };
    manualRefresh.current = () => poll(true);

    const startPolling = () => {
      websocket?.close(1000, "fallback polling");
      websocket = undefined;
      stream?.close();
      stream = undefined;
      if (!navigator.onLine) { setConn("offline"); return; }
      void poll();
    };

    const consume = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as unknown;
        const envelope = asRecord(parsed);
        const candidate = envelope?.data ?? parsed;
        const record = asRecord(candidate);
        if (record && typeof record.id === "string" && record.transferId == null && record.events == null) {
          if (record.status != null) apply({ transferId, status: record.status, events: [record] });
          return;
        }
        apply(candidate);
      } catch {
        // Malformed SSE payload is ignored; persisted polling remains the fallback.
      }
    };

    const startWebSocket = () => {
      const bases = publicRealtimeUrls();
      if (!bases.length || stopped || terminalRef.current || !navigator.onLine) return false;
      try {
        websocket?.close(1000, "replace");
        websocket = new ReconnectingWebSocket(
          () => bases.map((base) => transferRealtimeUrl(base, transferId, cursor.current)),
          publicRealtimeSocketOptions(),
        );
        websocket.addEventListener("message", (event) => {
          const message = event as MessageEvent<unknown>;
          if (typeof message.data === "string") consume(message as MessageEvent<string>);
        });
        websocket.addEventListener("state", (event) => {
          const state = (event as CustomEvent<string>).detail;
          if (state === "open") setConn("live");
          if (state === "exhausted" && !stopped && !terminalRef.current) {
            websocket = undefined;
            startStream();
          }
        });
        websocket.connect();
        return true;
      } catch {
        websocket = undefined;
        return false;
      }
    };

    const startStream = () => {
      if (stopped || terminalRef.current || !navigator.onLine) {
        if (!navigator.onLine) setConn("offline");
        return;
      }
      try {
        const qs = cursor.current ? `?cursor=${encodeURIComponent(cursor.current)}` : "";
        stream = new EventSource(`/api/v1/bridge/transfers/${encodeURIComponent(transferId)}/events/stream${qs}`);
        stream.onopen = () => { if (!stopped) setConn("live"); };
        stream.onmessage = consume;
        for (const eventName of ["snapshot", "transition", "status", "complete"]) stream.addEventListener(eventName, consume as EventListener);
        stream.onerror = startPolling;
      } catch {
        startPolling();
      }
    };
    if (realtimeAllowed) { if (!startWebSocket()) startStream(); } else startPolling();

    const visibility = () => {
      if (document.visibilityState === "visible" && connectionRef.current !== "live" && !terminalRef.current && navigator.onLine) void poll();
    };
    const cameOnline = () => {
      setError(null);
      if (!terminalRef.current && connectionRef.current !== "live") {
        if (realtimeAllowed) { if (!startWebSocket()) startStream(); } else startPolling();
      }
    };
    const wentOffline = () => {
      websocket?.close(1000, "offline");
      websocket = undefined;
      stream?.close();
      pollAbort?.abort();
      if (timer) clearTimeout(timer);
      setConn("offline");
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("online", cameOnline);
    window.addEventListener("offline", wentOffline);
    return () => {
      stopped = true;
      manualRefresh.current = null;
      websocket?.close(1000, "unmount");
      websocket = undefined;
      stream?.close();
      pollAbort?.abort();
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("online", cameOnline);
      window.removeEventListener("offline", wentOffline);
    };
  }, [transferId, pollIntervalMs, realtimeAllowed]);

  useEffect(() => {
    if (!online && !isTerminalTransferStatus(snapshot?.status)) {
      setConnection("offline");
      connectionRef.current = "offline";
    }
  }, [online, snapshot?.status]);

  const stale = lastUpdatedAt != null && clock - lastUpdatedAt > 30_000 && !isTerminalTransferStatus(snapshot?.status);
  return { snapshot, connection, error, lastUpdatedAt, stale, online, refresh };
}
