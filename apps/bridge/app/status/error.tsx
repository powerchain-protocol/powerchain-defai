"use client";

import { Button } from "@/components/ui/button";

export default function StatusError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="pc-theme-card mx-auto max-w-3xl p-6 sm:p-8" role="alert">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-amber-700 dark:text-amber-300">Status unavailable</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Operational evidence could not be rendered.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">PowerChain keeps new execution fail-closed when required health evidence is unavailable. Persisted operation records remain the authoritative recovery path.</p>
      <p className="mt-3 font-mono text-xs text-slate-500">{error.digest ? `Reference ${error.digest}` : "STATUS_RENDER_ERROR"}</p>
      <div className="mt-5"><Button onClick={reset}>Retry status</Button></div>
    </section>
  );
}
