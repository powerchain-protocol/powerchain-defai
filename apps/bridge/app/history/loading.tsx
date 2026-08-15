import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-5" aria-busy="true" aria-label="Loading bridge history">
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="space-y-px overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-20 w-full rounded-none" />)}
      </div>
    </main>
  );
}
