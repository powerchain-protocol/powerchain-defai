import type { SVGProps } from "react";

export function SwapIcon({ className = "size-5", ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
    <path d="M5 7.5h12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="m14.5 4.5 3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 16.5H6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="m9.5 13.5-3 3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 9.5c1.4 1.25 3.05 1.88 5 1.88 1.94 0 3.6-.63 5-1.88M17 14.5c-1.4-1.25-3.06-1.88-5-1.88-1.95 0-3.6.63-5 1.88" stroke="currentColor" strokeWidth=".85" opacity=".32" strokeLinecap="round"/>
  </svg>;
}
