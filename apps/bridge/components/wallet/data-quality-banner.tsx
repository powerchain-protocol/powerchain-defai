"use client";

import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";

type DataQuality = "fresh" | "stale" | "degraded" | "offline" | "unavailable";

export function DataQualityBanner({ quality, message, onRefresh, refreshing = false }: { quality: DataQuality; message?: string; onRefresh?: () => void; refreshing?: boolean }) {
  if (quality === "fresh") return null;

  const copy = quality === "offline"
    ? { tone: "danger" as const, title: "You are offline", body: "Existing transfer state is preserved. Do not resubmit while disconnected." }
    : quality === "unavailable"
      ? { tone: "danger" as const, title: "Wallet data unavailable", body: "New bridge and claim actions are blocked until fresh data is available." }
      : quality === "stale"
        ? { tone: "warning" as const, title: "Wallet data is stale", body: "Refresh before opening a new bridge or claim signature." }
        : { tone: "warning" as const, title: "Partial chain data", body: "Available chain data is shown, but one provider is degraded." };

  return (
    <InlineAlert tone={copy.tone} title={copy.title}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{message || copy.body}</span>
        {onRefresh && quality !== "offline" ? <Button size="sm" variant="secondary" onClick={onRefresh} loading={refreshing} loadingLabel="Refreshing…">Refresh</Button> : null}
      </div>
    </InlineAlert>
  );
}
