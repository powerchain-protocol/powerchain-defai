"use client";

import type { StakingTransactionJournalController } from "@/hooks/use-staking-transaction-journal";
import { solscanTransactionUrl } from "@/lib/explorers/links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function short(value: string) { return `${value.slice(0, 8)}…${value.slice(-8)}`; }
function label(value: string) { return value.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase()); }
function tone(state: string): "success" | "danger" | "warning" { return state === "finalized" ? "success" : state === "failed" ? "danger" : "warning"; }

export function StakingTransactionRecovery({ journal }: { journal: StakingTransactionJournalController }) {
  if (!journal.entries.length) return null;
  return (
    <Card className="overflow-hidden" aria-labelledby="staking-recovery-title">
      <CardHeader className="border-b border-slate-100 dark:border-white/10">
        <div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#35584a] dark:text-[#adc0b6]">Transaction recovery</p><h2 id="staking-recovery-title" className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Recent staking submissions</h2><p className="mt-1 text-xs leading-5 text-slate-500">PowerChain reconciles submitted signatures. It never retries a staking instruction automatically.</p></div>
        <Button size="sm" onClick={() => void journal.reconcile()} loading={journal.reconciling} loadingLabel="Checking…">Refresh</Button>
      </CardHeader>
      <CardContent className="divide-y divide-slate-100 px-4 pb-0 sm:px-5 dark:divide-white/10">
        {journal.entries.map((entry) => (
          <div key={entry.signature} className="grid gap-2 py-3 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-center">
            <div><p className="text-sm font-semibold capitalize text-slate-900 dark:text-white">{label(entry.action)}</p><p className="text-[11px] text-slate-500">{new Date(entry.submittedAt).toISOString().replace("T", " ").slice(0, 19)} UTC</p></div>
            <div className="min-w-0"><a className="block truncate font-mono text-xs text-[#35584a] hover:underline dark:text-[#adc0b6]" href={solscanTransactionUrl(entry.signature)} target="_blank" rel="noopener noreferrer">{short(entry.signature)} ↗</a>{entry.error ? <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-300">Transaction failed on-chain. Inspect the explorer record before retrying.</p> : null}</div>
            <div className="flex items-center gap-2"><Badge tone={tone(entry.state)}>{entry.state}</Badge><Button variant="ghost" size="sm" onClick={() => journal.clear(entry.signature)} aria-label="Remove transaction from local history" className="min-h-8 px-2 text-slate-400">×</Button></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
