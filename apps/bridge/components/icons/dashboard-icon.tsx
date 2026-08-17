import type { SVGProps } from "react";

export function DashboardIcon({ className = "size-5", ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
    <rect x="4" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7"/>
    <rect x="13" y="4" width="7" height="4" rx="1.6" stroke="currentColor" strokeWidth="1.7"/>
    <rect x="13" y="10" width="7" height="10" rx="2" stroke="currentColor" strokeWidth="1.7"/>
    <rect x="4" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M6.5 8h2M15.5 6h2M15.5 13h2M15.5 16h2M6.5 16.5h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity=".45"/>
  </svg>;
}
