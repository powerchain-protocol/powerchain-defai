"use client";
import { RouteErrorPanel } from "@/components/routing/route-error-panel";
export default function TransferStatusError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorPanel eyebrow="Transfer status unavailable" title="Persisted transfer status could not be displayed" description="This rendering failure does not mean the transfer failed or completed. Do not submit a replacement transfer from this screen; retry status or inspect History first." error={error} reset={reset} retryLabel="Retry transfer status" />;
}
