"use client";

import { Button } from "@/components/ui/button";
import { RecoveryActions } from "@/components/navigation/recovery-actions";
import { cn } from "@/components/ui/cn";

type RouteErrorPanelProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  reset: () => void;
  error?: Error & { digest?: string };
  retryLabel?: string;
  includeRecovery?: boolean;
  tone?: "critical" | "warning";
  className?: string;
}>;

/**
 * Consistent operational route recovery. Never renders raw exception messages;
 * only the framework digest may be surfaced as an opaque support reference.
 */
export function RouteErrorPanel({
  eyebrow,
  title,
  description,
  reset,
  error,
  retryLabel = "Try again",
  includeRecovery = true,
  tone = "critical",
  className,
}: RouteErrorPanelProps) {
  const toneClass = tone === "warning"
    ? "border-amber-200 dark:border-amber-900/70"
    : "border-rose-200 dark:border-rose-900/60";
  const eyebrowClass = tone === "warning"
    ? "text-amber-700 dark:text-amber-300"
    : "text-rose-700 dark:text-rose-300";

  return (
    <main className={cn("mx-auto flex min-h-[48vh] w-full max-w-2xl items-center justify-center py-8", className)}>
      <section className={cn("pc-theme-card w-full p-6 sm:p-8", toneClass)} role="alert" aria-labelledby="route-error-title">
        <p className={cn("text-[11px] font-bold uppercase tracking-[.16em]", eyebrowClass)}>{eyebrow}</p>
        <h1 id="route-error-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        {error?.digest ? <p className="mt-3 font-mono text-[11px] text-slate-500">Reference {error.digest}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={reset}>{retryLabel}</Button>
          {includeRecovery ? <RecoveryActions /> : null}
        </div>
      </section>
    </main>
  );
}
