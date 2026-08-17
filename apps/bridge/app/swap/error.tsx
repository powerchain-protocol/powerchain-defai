"use client";
import { RouteErrorPanel } from "@/components/routing/route-error-panel";
export default function SwapError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorPanel eyebrow="Swap unavailable" title="The swap workspace could not be loaded" description="No swap transaction was submitted by this rendering error. Retry the workspace and review History before repeating any wallet signature if a prior submission may already exist." error={error} reset={reset} retryLabel="Reload swap" />;
}
