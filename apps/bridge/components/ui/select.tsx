import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "./cn";
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return <span className="relative block"><select ref={ref} className={cn("pc-select min-h-11 appearance-none pc-theme-control px-3 pr-9 text-sm font-medium", className)} {...props}>{children}</select><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"><path d="m8 10 4 4 4-4" /></svg></span>;
});
