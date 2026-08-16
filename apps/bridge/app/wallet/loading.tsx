import { Skeleton } from "@/components/ui/skeleton";

export default function WalletLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-5" aria-busy="true" aria-label="Loading wallet overview">
      <div className="space-y-3"><Skeleton className="h-4 w-36" /><Skeleton className="h-9 w-72" /><Skeleton className="h-5 w-full max-w-2xl" /></div>
      <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>
      <Skeleton className="h-80 rounded-[20px]" />
    </main>
  );
}
