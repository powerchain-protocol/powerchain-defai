"use client";

import { SuiGrpcClient } from "@mysten/sui/grpc";
import { apiFetch } from "@/lib/api/browser-api";
import { normalizeHttpEndpoint } from "./storage";

export type EndpointTestResult = Readonly<{ ok: boolean; latencyMs: number; message: string }>;

async function timed(
  request: (signal: AbortSignal) => Promise<Response>,
  isHealthy: (response: Response) => boolean = (response) => response.ok,
): Promise<EndpointTestResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort("timeout"), 6_000);
  const started = performance.now();
  try {
    const response = await request(controller.signal);
    const latencyMs = Math.max(0, Math.round(performance.now() - started));
    const ok = isHealthy(response);
    return {
      ok,
      latencyMs,
      message: ok ? `Available · ${latencyMs} ms` : `HTTP ${response.status} · ${latencyMs} ms`,
    };
  } catch (error) {
    const latencyMs = Math.max(0, Math.round(performance.now() - started));
    return {
      ok: false,
      latencyMs,
      message: controller.signal.aborted
        ? `Timed out · ${latencyMs} ms`
        : error instanceof Error
          ? error.message
          : "Endpoint unavailable",
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function testPowerChainApi(baseUrl: string, apiKey = ""): Promise<EndpointTestResult> {
  const base = normalizeHttpEndpoint(baseUrl, { allowLocalDevelopment: process.env.NODE_ENV !== "production" });
  return timed((signal) => fetch(`${base}/api/v1/health`, {
    cache: "no-store",
    signal,
    headers: apiKey ? { accept: "application/json", "x-api-key": apiKey } : { accept: "application/json" },
  }));
}

export async function testSolanaRpc(endpoint: string): Promise<EndpointTestResult> {
  const url = normalizeHttpEndpoint(endpoint, { allowLocalDevelopment: process.env.NODE_ENV !== "production" });
  return timed((signal) => fetch(url, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
  }));
}


export async function testJupiterProvider(): Promise<EndpointTestResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort("timeout"), 6_000);
  const started = performance.now();
  try {
    const response = await apiFetch("/api/v1/swap/solana/provider", { cache: "no-store", signal: controller.signal });
    const latencyMs = Math.max(0, Math.round(performance.now() - started));
    const payload = await response.json().catch(() => null) as { data?: { source?: string; apiOrigin?: string }; error?: { code?: string } } | null;
    if (!response.ok) return { ok: false, latencyMs, message: `${payload?.error?.code ?? `HTTP_${response.status}`} · ${latencyMs} ms` };
    const source = payload?.data?.source === "user" ? "User credential" : "Deployment credential";
    const origin = payload?.data?.apiOrigin ? ` · ${payload.data.apiOrigin}` : "";
    return { ok: true, latencyMs, message: `${source}${origin} · ${latencyMs} ms` };
  } catch (error) {
    const latencyMs = Math.max(0, Math.round(performance.now() - started));
    return {
      ok: false,
      latencyMs,
      message: controller.signal.aborted ? `Timed out · ${latencyMs} ms` : error instanceof Error ? error.message : "Jupiter configuration unavailable",
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

/**
 * Test the same gRPC transport used by the wallet runtime. This prevents a reachable HTTP origin from
 * being reported healthy when it is not actually a compatible Sui endpoint.
 */
export async function testSuiRpc(endpoint: string): Promise<EndpointTestResult> {
  const url = normalizeHttpEndpoint(endpoint, { allowLocalDevelopment: process.env.NODE_ENV !== "production" });
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort("timeout"), 6_000);
  const started = performance.now();
  try {
    const client = new SuiGrpcClient({ network: "mainnet", baseUrl: url });
    const result = await client.getChainIdentifier({ signal: controller.signal });
    const latencyMs = Math.max(0, Math.round(performance.now() - started));
    const chainIdentifier = typeof result === "object" && result && "chainIdentifier" in result
      ? String(result.chainIdentifier)
      : "mainnet";
    return { ok: true, latencyMs, message: `Sui gRPC · ${chainIdentifier} · ${latencyMs} ms` };
  } catch (error) {
    const latencyMs = Math.max(0, Math.round(performance.now() - started));
    return {
      ok: false,
      latencyMs,
      message: controller.signal.aborted
        ? `Timed out · ${latencyMs} ms`
        : error instanceof Error
          ? error.message
          : "Sui gRPC endpoint unavailable",
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
