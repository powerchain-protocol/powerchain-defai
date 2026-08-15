import { Skeleton } from "./skeleton";

export function BridgeFormSkeleton() {
  return <div className="space-y-4" role="status" aria-label="Loading bridge form"><Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-14 w-full rounded-2xl" /><Skeleton className="h-32 w-full rounded-2xl" /><Skeleton className="h-12 w-full rounded-xl" /><span className="sr-only">Loading bridge form</span></div>;
}

export function TransferStatusSkeleton() {
  return <div className="rounded-[20px] border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950" role="status" aria-label="Loading transfer status"><div className="flex justify-between gap-4"><div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-5 w-48 max-w-[65vw]" /></div><Skeleton className="h-7 w-16 rounded-full" /></div><div className="mt-6 space-y-4">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="flex items-center gap-3"><Skeleton className="h-7 w-7 rounded-full" /><Skeleton className="h-4 flex-1" /></div>)}</div><span className="sr-only">Loading transfer status</span></div>;
}

export function HistoryListSkeleton({ rows = 5 }: { rows?: number }) {
  const count = Math.max(1, Math.min(rows, 12));
  return <div className="space-y-3" role="status" aria-label="Loading transfer history">{Array.from({ length: count }).map((_, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start justify-between gap-4"><div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-4 w-40" /></div><Skeleton className="h-6 w-20 rounded-full" /></div><div className="mt-4 flex justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-16" /></div></div>) }<span className="sr-only">Loading transfer history</span></div>;
}
