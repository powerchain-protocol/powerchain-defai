import "server-only";
import { randomUUID } from "node:crypto";

const MAX_JSON_BYTES = 64 * 1024;
const REQUEST_ID = /^[A-Za-z0-9._:-]{8,128}$/;

export function requestId(req: Request): string {
  const supplied = req.headers.get("x-request-id")?.trim() ?? "";
  return REQUEST_ID.test(supplied) ? supplied : randomUUID();
}

export function responseHeaders(id: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("x-request-id", id);
  headers.set("x-content-type-options", "nosniff");
  headers.set("cache-control", headers.get("cache-control") ?? "no-store, max-age=0");
  return headers;
}

export function ok<T>(data: T, status = 200, id = randomUUID(), extra?: HeadersInit): Response {
  return Response.json({ ok: true, data, requestId: id }, { status, headers: responseHeaders(id, extra) });
}

export function fail(code: string, message: string, status: number, id = randomUUID(), retryable = false, details?: unknown): Response {
  return Response.json(
    { ok: false, error: { code, message, retryable, ...(details === undefined ? {} : { details }) }, requestId: id },
    { status, headers: responseHeaders(id) },
  );
}

export async function json(req: Request, maxBytes = MAX_JSON_BYTES): Promise<unknown> {
  const type = req.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (type !== "application/json") throw new Error("UNSUPPORTED_MEDIA_TYPE");
  const length = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.byteLength > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error("INVALID_JSON");
  }
}
