"use client";
import { RouteErrorPanel } from "@/components/routing/route-error-panel";
export default function ProtocolError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorPanel eyebrow="Protocol evidence unavailable" title="Program verification could not be rendered" description="Source configuration is not treated as deployment evidence. Until fresh RPC verification is available, PowerChain continues to fail closed for actions that require a verified program." error={error} reset={reset} retryLabel="Retry verification view" tone="warning" />;
}
