import { CopyAddress } from "./copy-address";

export type BridgeTransactionSummaryProps = {
  sourceLabel: string;
  destinationLabel: string;
  principal: string;
  serviceFee: string;
  totalDebit: string;
  recipient?: string | null;
  feeRecipient?: string | null;
  estimatedTime?: string | null;
};

export function BridgeTransactionSummary(props: BridgeTransactionSummaryProps) {
  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-950" aria-labelledby="bridge-summary-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="bridge-summary-title" className="text-base font-semibold text-slate-950 dark:text-white">Review transfer</h2>
        <span className="rounded-full border border-[#d4ddd8] bg-[#f1f4f2] px-2.5 py-1 text-[11px] font-semibold text-[#294a3b] dark:border-[#29483c] dark:bg-[#09110e]/60 dark:text-[#d0dcd6]">1:1 principal</span>
      </div>
      <dl className="mt-4 divide-y divide-slate-100 text-sm dark:divide-slate-800">
        <Row label="Route" value={`${props.sourceLabel} → ${props.destinationLabel}`} />
        <Row label="Bridge principal" value={props.principal} strong />
        <Row label="Service fee" value={props.serviceFee} />
        <Row label="Source token debit" value={props.totalDebit} strong />
        {props.estimatedTime ? <Row label="Estimated time" value={props.estimatedTime} /> : null}
      </dl>
      {props.recipient || props.feeRecipient ? (
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-2">
          {props.recipient ? <AddressBlock label="Destination recipient" value={props.recipient} /> : null}
          {props.feeRecipient ? <AddressBlock label="Service-fee recipient" value={props.feeRecipient} /> : null}
        </div>
      ) : null}
      <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">Network gas is paid separately in the source chain's native asset and is not deducted from the bridge principal.</p>
    </section>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0"><dt className="text-slate-500 dark:text-slate-400">{label}</dt><dd className={`text-right tabular-nums ${strong ? "font-semibold text-slate-950 dark:text-white" : "font-medium text-slate-700 dark:text-slate-200"}`}>{value}</dd></div>;
}
function AddressBlock({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p><CopyAddress value={value} label={label.toLowerCase()} /></div>;
}
