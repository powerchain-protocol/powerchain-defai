"use client";
import { RouteErrorPanel } from "@/components/routing/route-error-panel";
export default function ChatError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorPanel eyebrow="Assistant unavailable" title="PowerChain AI could not be rendered" description="The assistant is advisory and cannot sign or submit wallet actions. Retry this view; persisted transactions and runtime status remain available independently." error={error} reset={reset} retryLabel="Reload assistant" />;
}
