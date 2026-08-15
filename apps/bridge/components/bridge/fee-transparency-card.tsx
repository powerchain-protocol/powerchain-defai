import { CopyAddress } from "./copy-address";

export function FeeTransparencyCard({ solanaRecipient = "FeeszhrKKEsvxr1kg8LDtPx6BLcEbYHiAThYaxajNhqy" }: { solanaRecipient?: string }) {
  return (
    <aside className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Fee transparency</p>
      <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">What you pay</h2>
      <dl className="mt-4 divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <Row term="Bridge principal" detail="Always 1:1" />
        <Row term="PowerChain service fee" detail="Governed per route" />
        <Row term="Network gas" detail="Paid in source-chain native token" />
      </dl>
      <div className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/70">
        <p className="text-xs font-medium text-slate-500">Solana fee wallet</p>
        <div className="mt-2"><CopyAddress value={solanaRecipient} label="Solana fee wallet" /></div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">The backend verifies the source-chain fee transaction independently. The bridge service never needs the fee wallet private key.</p>
    </aside>
  );
}

function Row({ term, detail }: { term: string; detail: string }) {
  return <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><dt className="text-slate-600 dark:text-slate-300">{term}</dt><dd className="text-right font-semibold text-slate-950 dark:text-white">{detail}</dd></div>;
}
