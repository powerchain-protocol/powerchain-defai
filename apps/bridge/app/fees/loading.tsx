import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingFeesPage() {
  return <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><Skeleton className="h-5 w-32" /><Skeleton className="mt-4 h-10 w-80 max-w-full" /><Skeleton className="mt-3 h-6 w-full max-w-2xl" /><div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><Skeleton className="h-[430px]" /><Skeleton className="h-[330px]" /></div></main>;
}
