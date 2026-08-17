import Link from "next/link";
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "@/components/ui/card";
import { ClaimStatusTimeline, type ClaimTimelineStatus } from "./claim-status-timeline";
import { compactAddress, formatDateTime, formatRelativeAge, humanizeCode } from "@/utils/helpers";
import { claimStatusNeedsAttention, terminalClaimStatus } from "@/lib/claim/claim-contract";

export type ClaimStatusCardData = Readonly<{
  id: string;
  wallet: string;
  status: ClaimTimelineStatus;
  amount: string;
  sourceTx?: string | null;
  failureCode?: string | null;
  reservationExpiresAt: string;
  finalizedAt?: string | null;
  updatedAt: string;
}>;

export function ClaimStatusCard({ claim }: { claim: ClaimStatusCardData }) {
  const terminal = terminalClaimStatus(claim.status);
  const needsAttention = claimStatusNeedsAttention(claim.status);
  return <Card>
    <CardHeader className="flex-col sm:flex-row">
      <div className="flex min-w-0 items-start gap-3"><CardIcon><span className="text-lg" aria-hidden="true">↓</span></CardIcon><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#557568]">Persisted claim</p><CardTitle className="mt-1 font-mono text-sm break-all">{claim.id}</CardTitle><p className="mt-1 text-xs text-slate-500">Updated {formatRelativeAge(claim.updatedAt)}</p></div></div>
      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${needsAttention ? "bg-amber-50 text-amber-800 dark:bg-amber-950/25 dark:text-amber-200" : terminal ? "bg-[#eaf0ed] text-[#214233] dark:bg-[#173b2d]/35 dark:text-[#d0dcd6]" : "bg-[#eef3f0] text-[#294a3b] dark:bg-[#173b2d]/35 dark:text-[#d0dcd6]"}`}>{humanizeCode(claim.status)}</span>
    </CardHeader>
    <CardContent className="space-y-5">
      <ClaimStatusTimeline status={claim.status}/>
      {needsAttention ? <aside className="rounded-[14px] border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-200" role="status"><strong>{claim.status === "UNKNOWN" ? "Submission outcome is not yet known." : claim.status === "EXPIRED" ? "This reservation expired." : "This claim needs attention."}</strong> {claim.status === "UNKNOWN" ? "Do not create a second claim; continue checking this persisted ID." : claim.failureCode ? `Reason: ${humanizeCode(claim.failureCode)}.` : "Review status before retrying."}</aside> : null}
      <dl className="grid gap-3 sm:grid-cols-2">
        <Item label="Amount" value={`${claim.amount} PWRC`}/><Item label="Wallet" value={compactAddress(claim.wallet, 8, 6)} title={claim.wallet}/><Item label="Source transaction" value={claim.sourceTx ? compactAddress(claim.sourceTx, 8, 6) : "Pending"} title={claim.sourceTx ?? undefined}/><Item label="Reservation" value={formatDateTime(claim.reservationExpiresAt)}/>{claim.finalizedAt ? <Item label="Finalized" value={formatDateTime(claim.finalizedAt)}/> : null}
      </dl>
      <div className="flex flex-col gap-2 border-t border-slate-200/80 pt-4 dark:border-white/8 sm:flex-row"><Link href="/wallet" className="pc-button-primary pc-theme-control inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold text-white sm:min-w-32">Open wallet</Link><Link href="/claim" className="pc-button-light pc-theme-control inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold">Back to claims</Link></div>
    </CardContent>
  </Card>;
}

function Item({ label, value, title }: { label: string; value: string; title?: string }) { return <div className="rounded-[14px] border border-slate-200/80 bg-slate-50/75 px-3.5 py-3 dark:border-white/8 dark:bg-white/[.035]"><dt className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">{label}</dt><dd title={title} className="mt-1 break-all text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</dd></div>; }
