import { loadBridgeEventSnapshot } from "@/server/services/bridge-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();
const TERMINAL = new Set(["COMPLETED", "FAILED"]);

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const url = new URL(request.url);
  let cursor = url.searchParams.get("cursor");

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const close = () => {
        if (closed) return;
        closed = true;
        if (timer) clearTimeout(timer);
        try { controller.close(); } catch {}
      };
      const write = (value: string) => {
        if (!closed) controller.enqueue(encoder.encode(value));
      };

      const tick = async () => {
        if (closed || request.signal.aborted) return close();
        try {
          const snapshot = await loadBridgeEventSnapshot(id, { cursor, limit: 100 });
          const last = snapshot.events.at(-1)?.id;
          if (last) cursor = last;
          write(`event: snapshot\ndata: ${JSON.stringify({ data: snapshot })}\n\n`);
          if (TERMINAL.has(snapshot.status)) return close();
        } catch {
          write(`event: error\ndata: ${JSON.stringify({ error: "TRANSFER_STREAM_FAILED" })}\n\n`);
          return close();
        }
        timer = setTimeout(() => void tick(), 2_000);
      };

      write("retry: 2500\n\n");
      request.signal.addEventListener("abort", close, { once: true });
      void tick();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
