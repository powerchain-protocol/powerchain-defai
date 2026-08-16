import { Skeleton } from "@/components/ui/skeleton";

export default function ClaimLoading() {
  return (
    <main className="mx-auto max-w-3xl space-y-5" aria-busy="true" aria-label="Loading claim">
      <div className="space-y-3"><Skeleton className="h-4 w-40" /><Skeleton className="h-9 w-64" /><Skeleton className="h-5 w-full max-w-2xl" /></div>
      <Skeleton className="h-[420px] rounded-[20px]" />
    </main>
  );
}
