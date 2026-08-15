import { CopyAddress } from "./copy-address";
import { TransferStatusChip } from "./transfer-status-chip";

export type TransferDetailsPanelProps = {
  transferId: string;
  status: string;
  route: string;
  principal: string;
  symbol?: string;
  recipient?: string | null;
  sourceTx?: string | null;
  destinationTx?: string | null;
  sourceFinalityRef?: string | null;
  destinationFinalityRef?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export function TransferDetailsPanel({ transferId, status, route, principal, symbol = "PWRC", recipient, sourceTx, destinationTx, sourceFinalityRef, destinationFinalityRef, createdAt, updatedAt }: TransferDetailsPanelProps) {
  const rows = [
    ["Recipient", recipient], ["Source transaction", sourceTx], ["Destination transaction", destinationTx],
    ["Source finality", sourceFinalityRef], ["Destination finality", destinationFinalityRef],
  ] as const;
  return <section className="rounded-[20px] border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950" aria-labelledby="transfer-details-title">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Transfer details</p><h2 id="transfer-details-title" className="mt-1 text-base font-semibold text-slate-950 dark:text-white">{route}</h2></div><TransferStatusChip status={status} /></div>
    <dl className="mt-5 grid gap-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <DetailRow label="Principal"><span className="font-semibold tabular-nums">{principal} {symbol}</span></DetailRow>
      <DetailRow label="Transfer ID"><CopyAddress value={transferId} label="transfer ID" /></DetailRow>
      {rows.map(([label, value]) => value ? <DetailRow key={label} label={label}><CopyAddress value={value} label={label.toLowerCase()} /></DetailRow> : null)}
      {createdAt ? <DetailRow label="Created"><time dateTime={createdAt}>{formatUtc(createdAt)}</time></DetailRow> : null}
      {updatedAt ? <DetailRow label="Updated"><time dateTime={updatedAt}>{formatUtc(updatedAt)}</time></DetailRow> : null}
    </dl>
  </section>;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1 border-b border-slate-200 px-3 py-3 last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center dark:border-slate-800"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="min-w-0 text-sm text-slate-900 dark:text-slate-100">{children}</dd></div>;
}

function formatUtc(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${p(date.getUTCMonth()+1)}-${p(date.getUTCDate())} ${p(date.getUTCHours())}:${p(date.getUTCMinutes())}:${p(date.getUTCSeconds())} UTC`;
}
