import { defaiAssistantReply } from "@powerchain/backend/services/defai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const MAX_MESSAGE_LENGTH = 4000;

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("message" in body) || typeof body.message !== "string") return NextResponse.json({ error: "INVALID_CHAT_REQUEST" }, { status: 400 });
  const message = body.message.trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) return NextResponse.json({ error: "INVALID_CHAT_MESSAGE" }, { status: 400 });
  const result = await defaiAssistantReply({ message });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
