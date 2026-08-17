export type ClaimTimelineStatus = "RESERVED" | "SUBMITTING" | "SUBMITTED" | "FINALIZED" | "FAILED" | "EXPIRED" | "UNKNOWN" | "MANUAL_REVIEW";

const STEPS = ["RESERVED", "SUBMITTING", "SUBMITTED", "FINALIZED"] as const;

export function ClaimStatusTimeline({ status }: { status: ClaimTimelineStatus }) {
  const index = STEPS.indexOf(status as (typeof STEPS)[number]);
  const current = index >= 0 ? index : status === "UNKNOWN" ? 2 : status === "FAILED" || status === "MANUAL_REVIEW" ? 2 : 0;
  const problem = status === "FAILED" || status === "MANUAL_REVIEW" || status === "EXPIRED" || status === "UNKNOWN";
  return <ol className="grid gap-2 sm:grid-cols-4" aria-label="Claim progress">{STEPS.map((step, stepIndex) => {
    const active = stepIndex <= current;
    const currentStep = stepIndex === current;
    return <li key={step} aria-current={currentStep ? "step" : undefined} className={`relative overflow-hidden rounded-[14px] border p-3 text-xs font-semibold ${problem && currentStep ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-200" : active ? "border-[#cddbd4] bg-[#f0f4f2] text-[#214233] dark:border-[#29483c] dark:bg-[#0b1712] dark:text-[#d0dcd6]" : "border-slate-200 bg-white text-slate-400 dark:border-white/8 dark:bg-white/[.02] dark:text-slate-500"}`}><span className="block text-[9px] uppercase tracking-[.13em] opacity-65">Step {stepIndex + 1}</span><span className="mt-1 block">{step.replaceAll("_", " ")}</span>{active ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-current opacity-35"/> : null}</li>;
  })}</ol>;
}
