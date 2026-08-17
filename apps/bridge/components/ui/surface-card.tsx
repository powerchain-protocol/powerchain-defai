import type { HTMLAttributes, ReactNode } from "react";

function join(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SurfaceCard({
  className,
  children,
  interactive = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; interactive?: boolean }) {
  return (
    <div
      className={join(
        "rounded-[20px] border border-slate-200/90 bg-white shadow-[0_8px_30px_rgba(15,23,42,.045)]",
        "dark:border-white/10 dark:bg-[#0a0f0c] dark:shadow-[0_16px_42px_rgba(0,0,0,.24)]",
        interactive && "transition duration-200 hover:-translate-y-0.5 hover:border-[#a7b7af] hover:shadow-[0_14px_36px_rgba(15,23,42,.075)] dark:hover:border-[#557568]/55",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SurfaceCardHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={join("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="pc-section-label">{eyebrow}</p> : null}
        <h2 className={join("font-semibold tracking-tight text-slate-950 dark:text-white", eyebrow ? "mt-1.5" : undefined)}>{title}</h2>
        {description ? <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
