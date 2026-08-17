"use client";
import { RouteErrorPanel } from "@/components/routing/route-error-panel";
export default function StakingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorPanel eyebrow="Staking unavailable" title="Staking readiness could not be rendered" description="No APR, reward, pool availability, or deployment state is inferred from this error. Retry only after the runtime evidence view is available." error={error} reset={reset} retryLabel="Reload staking" tone="warning" />;
}
