"use client";

export type TransactionResultKind = "rejected" | "expired" | "failed" | "submitted";
export function TransactionResultAlert({ kind, message, onRetry, transferHref }: { kind: TransactionResultKind; message?: string; onRetry?: () => void; transferHref?: string }) {
  const config = {
    rejected: ["Wallet request cancelled", "No transaction was submitted. You can review the details and try again."],
    expired: ["Quote expired before signing", "Refresh the quote to lock the current service fee and recipient before retrying."],
    failed: ["Transaction was not submitted", "Review the wallet/network state before retrying. Do not repeatedly sign an unknown transaction."],
    submitted: ["Transaction submitted", "Your transfer has been submitted. Follow persisted bridge status instead of submitting it again."],
  } as const;
  const [title, fallback] = config[kind];
  const good = kind === "submitted";
  return <div role={good ? "status" : "alert"} className={`rounded-2xl border p-4 ${good ? "border-[#d4ddd8] bg-[#f1f4f2] dark:border-[#29483c] dark:bg-[#09110e]/40" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"}`}><p className="text-sm font-semibold text-slate-950 dark:text-white">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{message || fallback}</p><div className="mt-3 flex flex-wrap gap-2">{onRetry && !good ? <button type="button" onClick={onRetry} className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">Try again</button> : null}{transferHref ? <a href={transferHref} className="inline-flex min-h-10 items-center rounded-xl bg-[#0b1511] px-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a]">View transfer</a> : null}</div></div>;
}
