import { Skeleton } from "@/components/ui/skeleton";

export default function IntegrationsLoading() {
  return (
    <main className="mx-auto max-w-5xl space-y-6" aria-busy="true" aria-label="Loading integrations">
      <div className="space-y-3"><Skeleton className="h-4 w-44" /><Skeleton className="h-9 w-96 max-w-full" /><Skeleton className="h-5 w-full max-w-2xl" /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-44 rounded-2xl" />)}</div>
    </main>
  );
}
