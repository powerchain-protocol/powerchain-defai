export type ToastTone = "success" | "error" | "warning" | "info";
export type ToastMessage = { id: string; title: string; description?: string; tone: ToastTone; durationMs: number };
type Listener = (toast: ToastMessage) => void;
const listeners = new Set<Listener>();
function secureId(): string {
  const webCrypto = globalThis.crypto as Crypto | undefined;
  if (!webCrypto) throw new Error("WEB_CRYPTO_REQUIRED");
  return webCrypto.randomUUID();
}
export function toast(input: Omit<ToastMessage, "id" | "durationMs"> & { durationMs?: number }): string {
  const id = secureId();
  const message: ToastMessage = { ...input, id, durationMs: Math.max(1500, Math.min(15000, input.durationMs ?? 5000)) };
  for (const listener of listeners) listener(message);
  return id;
}
export function subscribeToToasts(listener: Listener): () => void { listeners.add(listener); return () => listeners.delete(listener); }
