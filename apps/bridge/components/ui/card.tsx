import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type CardElement = "div" | "section" | "aside" | "article";
type CardProps = HTMLAttributes<HTMLElement> & { interactive?: boolean; as?: CardElement };

export function Card({ className, interactive = false, as: Component = "div", ...props }: CardProps) {
  return (
    <Component
      className={cn(
        "pc-card rounded-[var(--pc-radius-card)] border border-slate-200/80 bg-white text-slate-950 dark:border-white/10 dark:bg-[#0a100d] dark:text-white",
        interactive && "pc-card-interactive",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("flex items-start justify-between gap-4 p-4 sm:p-5", className)} {...props} />; }
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("px-4 pb-4 sm:px-5 sm:pb-5", className)} {...props} />; }
export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("flex items-center gap-3 border-t border-slate-200/80 px-4 py-3 dark:border-white/8 sm:px-5", className)} {...props} />; }
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) { return <h3 className={cn("text-base font-semibold tracking-tight", className)} {...props} />; }
export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) { return <p className={cn("mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400", className)} {...props} />; }
export function CardIcon({ children, className }: { children: ReactNode; className?: string }) { return <span className={cn("grid size-10 shrink-0 place-items-center rounded-[var(--pc-radius-control)] border border-slate-200 bg-slate-50 text-[#294a3b] shadow-sm dark:border-white/10 dark:bg-white/[.05] dark:text-[#d0dcd6]", className)}>{children}</span>; }
