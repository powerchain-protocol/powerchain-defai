import type { ClaimExecutionStatus } from "@/lib/claim/claim-contract";

const STEPS: ClaimExecutionStatus[] = ["RESERVED", "SUBMITTING", "SUBMITTED", "FINALIZED"];
export function ClaimStatusTimeline({ status }: { status: ClaimExecutionStatus }) {
  const current = Math.max(0, STEPS.indexOf(status));
  const review = status === "MANUAL_REVIEW" || status === "FAILED";
  return <ol className="grid gap-2 sm:grid-cols-4" aria-label="Claim progress">{STEPS.map((step, index) => <li key={step} aria-current={index === current ? "step" : undefined} className={`rounded-xl border p-3 text-xs font-medium ${review && index === current ? "border-rose-300 bg-rose-50 text-rose-800" : index <= current ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-500"}`}>{step.replaceAll("_", " ")}</li>)}</ol>;
}
