import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./cn";
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn("pc-input min-h-11 pc-theme-control px-3 text-sm placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-55 dark:placeholder:text-slate-600", className)} {...props} />;
});
