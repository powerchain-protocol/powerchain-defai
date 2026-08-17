"use client";

import { usePwrcIntegrity } from "@/hooks/use-pwrc-integrity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";

function ChainState({ name, ok, detail }: { name: string; ok: boolean | undefined; detail: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--pc-radius-control)] border border-slate-200 px-3 py-2.5 dark:border-slate-800">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-950 dark:text-white">{name}</p>
        {detail ? <p className="truncate text-xs text-slate-500 dark:text-slate-400">{detail}</p> : null}
      </div>
      <Badge tone={ok === undefined ? "neutral" : ok ? "success" : "warning"}>{ok === undefined ? "Pending" : ok ? "Verified" : "Attention"}</Badge>
    </div>
  );
}

export function AssetIntegrityCard() {
  const { data, loading, error, online, stale, refresh } = usePwrcIntegrity();
  const solanaDetail = data?.solana?.data?.finalizedSlot
    ? `Finalized slot ${data.solana.data.finalizedSlot}${typeof data.solana.data.headAgeMs === "number" ? ` · ${Math.round(data.solana.data.headAgeMs / 1000)}s old` : ""}`
    : data?.solana?.ok === false ? "Live verification unavailable" : null;
  const suiDetail = data?.sui?.data?.chainIdentifier
    ? `Chain ${data.sui.data.chainIdentifier}${typeof data.sui.data.headAgeMs === "number" ? ` · ${Math.round(data.sui.data.headAgeMs / 1000)}s old` : ""}`
    : data?.sui?.ok === false ? "Live verification unavailable" : null;

  return (
    <Card aria-labelledby="asset-integrity-title">
      <CardHeader className="items-start">
        <div>
          <h2 id="asset-integrity-title" className="text-sm font-semibold text-slate-950 dark:text-white">Asset integrity</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Checks configured PWRC/wPWRC identities against live chain metadata. This is operational validation, not bridge accounting evidence.</p>
        </div>
        <Button size="sm" onClick={() => void refresh()} disabled={!online} loading={loading} loadingLabel="Checking…">{online ? "Recheck" : "Offline"}</Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <ChainState name="Solana PWRC" ok={data?.solana?.ok} detail={solanaDetail} />
        <ChainState name="Sui wPWRC" ok={data?.sui?.ok} detail={suiDetail} />
        {data?.assetFingerprint ? <p className="break-all font-mono text-[11px] text-slate-500 dark:text-slate-400">Asset fingerprint {data.assetFingerprint}</p> : null}
        {stale ? <InlineAlert title="Integrity evidence is stale" tone="warning">Refresh before relying on this evidence for an operational decision.</InlineAlert> : null}
        {error ? <InlineAlert title={error === "INTEGRITY_OFFLINE" ? "Integrity verification paused offline" : "Integrity verification unavailable"} tone="warning">Configured asset identities remain unchanged, but fresh chain verification is not currently available.</InlineAlert> : null}
      </CardContent>
    </Card>
  );
}
