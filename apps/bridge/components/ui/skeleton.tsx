export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800 ${className}`} />;
}
