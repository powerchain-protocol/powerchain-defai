import "server-only";
import { NextResponse } from "next/server";
import { requestId, responseHeaders } from "../http";

const MAX_BODY_BYTES = 32 * 1024;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{16,128}$/;

export type ClaimMutationKind = "reserve" | "submit";

function claimError(status: number, code: string, message: string, id: string) {
  return NextResponse.json(
    { ok: false, error: { code, message, retryable: false }, requestId: id },
    { status, headers: responseHeaders(id) },
  );
}

export async function validateClaimMutationRequest(request: Request, kind: ClaimMutationKind) {
  const id = requestId(request);
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") return { ok: false as const, response: claimError(415, "UNSUPPORTED_MEDIA_TYPE", "application/json is required", id) };
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return { ok: false as const, response: claimError(413, "PAYLOAD_TOO_LARGE", "Claim request exceeds 32 KiB", id) };
  const key = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!IDEMPOTENCY_KEY.test(key)) return { ok: false as const, response: claimError(400, kind === "submit" ? "IDEMPOTENCY_KEY_REQUIRED" : "INVALID_IDEMPOTENCY_KEY", "A valid Idempotency-Key is required for claim mutations", id) };
  const clone = request.clone();
  const reader = clone.body?.getReader();
  if (reader) {
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return { ok: false as const, response: claimError(413, "PAYLOAD_TOO_LARGE", "Claim request exceeds 32 KiB", id) };
      }
    }
  }
  return { ok: true as const, idempotencyKey: key, requestId: id };
}
