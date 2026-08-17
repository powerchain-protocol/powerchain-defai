"use client";
import { RouteErrorPanel } from "@/components/routing/route-error-panel";
export default function ExplorerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorPanel eyebrow="Explorer unavailable" title="Explorer tools could not be rendered" description="Explorer links are read-only context and never establish PowerChain settlement finality. Retry this view or use persisted History for operation recovery." error={error} reset={reset} retryLabel="Reload explorer" tone="warning" />;
}
