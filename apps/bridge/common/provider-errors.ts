export function providerErrorMessage(reason: unknown, fallback: string): string {
  if (reason instanceof Error && reason.message.trim()) return reason.message;
  return fallback;
}

export function providerIsAbort(reason: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (reason instanceof DOMException && reason.name === "AbortError");
}
