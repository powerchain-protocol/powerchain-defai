import "server-only";

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { BridgeRuntimeCapability } from "../services/bridge-runtime";

const MAX_BODY_BYTES = 64 * 1024;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/;
const REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export type BridgeMutationContext = { requestId: string; idempotencyKey: string | null };

function error(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json({ error: code, message, requestId }, { status, headers: { "cache-control": "no-store, max-age=0", "x-request-id": requestId } });
}

export async function validateBridgeMutationRequest(request: Request, capability: BridgeRuntimeCapability): Promise<
  | { ok: true; context: BridgeMutationContext }
  | { ok: false; response: NextResponse }
> {
  const suppliedRequestId = request.headers.get("x-request-id")?.trim() ?? "";
  const requestId = REQUEST_ID.test(suppliedRequestId) ? suppliedRequestId : randomUUID();
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  if (contentType !== "application/json") return { ok: false, response: error(415, "UNSUPPORTED_MEDIA_TYPE", "Bridge mutations require application/json.", requestId) };
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return { ok: false, response: error(413, "PAYLOAD_TOO_LARGE", "Bridge mutation payload exceeds 64 KiB.", requestId) };
  const key = request.headers.get("idempotency-key")?.trim() || null;
  if (capability === "transfer-submit" && !key) return { ok: false, response: error(400, "IDEMPOTENCY_KEY_REQUIRED", "Transfer submission requires Idempotency-Key.", requestId) };
  if (key && !IDEMPOTENCY_KEY.test(key)) return { ok: false, response: error(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must be 16-128 safe ASCII characters.", requestId) };
  const reader = request.clone().body?.getReader();
  if (reader) {
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return { ok: false, response: error(413, "PAYLOAD_TOO_LARGE", "Bridge mutation payload exceeds 64 KiB.", requestId) };
      }
    }
  }
  return { ok: true, context: { requestId, idempotencyKey: key } };
}
