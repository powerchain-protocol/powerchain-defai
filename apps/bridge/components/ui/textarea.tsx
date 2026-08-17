import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "./cn";
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn("pc-textarea pc-theme-control text-sm placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-55 dark:placeholder:text-slate-600", className)} {...props} />;
});
