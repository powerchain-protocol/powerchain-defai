import { Skeleton } from "@/components/ui/skeleton";

export default function BridgeLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-5" aria-busy="true" aria-label="Loading bridge">
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.75fr)]">
        <Skeleton className="h-[540px] w-full rounded-[20px]" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
