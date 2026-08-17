import type { SVGProps } from "react";

export function BridgeIcon({ className = "size-5", ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
    <path d="M4 17.5h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M6 17.5v-4.2a6 6 0 0 1 12 0v4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M8.5 17.5v-4.1a3.5 3.5 0 0 1 7 0v4.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".72"/>
    <path d="M4 7.25h5.5M7.25 4.75 9.75 7.25 7.25 9.75M20 7.25h-5.5M16.75 4.75l-2.5 2.5 2.5 2.5" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
