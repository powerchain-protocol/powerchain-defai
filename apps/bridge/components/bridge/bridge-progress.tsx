export type BridgeProgressStep = {
  id: string;
  label: string;
  description?: string;
  state: "complete" | "current" | "upcoming" | "error";
};

export function BridgeProgress({ steps }: { steps: readonly BridgeProgressStep[] }) {
  return (
    <ol aria-label="Bridge progress" className="space-y-1">
      {steps.map((step, index) => {
        const complete = step.state === "complete";
        const current = step.state === "current";
        const error = step.state === "error";
        return (
          <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
            {index < steps.length - 1 ? <span aria-hidden="true" className="absolute left-[13px] top-7 h-[calc(100%-1rem)] w-px bg-slate-200 dark:bg-slate-800" /> : null}
            <span
              aria-hidden="true"
              className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                error
                  ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  : complete
                    ? "border-[#557568] bg-[#1c4334] text-white"
                    : current
                      ? "border-[#567668] bg-[#173b2d] text-white"
                      : "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950"
              }`}
            >
              {complete ? "✓" : error ? "!" : index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">{step.label}</p>
              {step.description ? <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{step.description}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
