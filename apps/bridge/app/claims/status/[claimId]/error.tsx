"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ClaimStatusError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-3xl"><section className="pc-theme-card p-6 sm:p-8" role="alert"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-amber-700 dark:text-amber-300">Claim status unavailable</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">The persisted claim record could not be loaded.</h1><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Do not create a second claim because a status read failed. Retry this claim ID or return to Claims and use the original persisted operation record.</p><p className="mt-3 font-mono text-xs text-slate-500">{error.digest ? `Reference ${error.digest}` : "CLAIM_STATUS_RENDER_ERROR"}</p><div className="mt-5 flex flex-wrap gap-2"><Button variant="primary" onClick={reset}>Retry status</Button><Link href="/claim" className="pc-button-light pc-theme-control inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold">Back to claims</Link></div></section></main>;
}
