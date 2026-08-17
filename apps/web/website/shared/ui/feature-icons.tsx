import type { SVGProps } from "react";

export type FeatureIconName = "chains" | "rpc" | "api" | "diagnostics" | "claims" | "recovery" | "security" | "cloud";

export function FeatureIcon({ name, className = "size-4" }: { name: FeatureIconName; className?: string }) {
  const props: SVGProps<SVGSVGElement> = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true };
  switch (name) {
    case "chains": return <svg {...props}><circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><path d="M10 12h4"/></svg>;
    case "rpc": return <svg {...props}><path d="M4 7h16M4 17h16M7 4v6m10-6v6M7 14v6m10-6v6"/></svg>;
    case "api": return <svg {...props}><path d="m8 8-4 4 4 4m8-8 4 4-4 4M14 5l-4 14"/></svg>;
    case "diagnostics": return <svg {...props}><path d="M4 18V6m4 12v-5m4 5V9m4 9v-8m4 8V4"/></svg>;
    case "claims": return <svg {...props}><path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/></svg>;
    case "recovery": return <svg {...props}><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5"/></svg>;
    case "security": return <svg {...props}><path d="M12 3 5 7v5c0 4.5 2.8 7.3 7 9 4.2-1.7 7-4.5 7-9V7z"/><path d="m9.5 12 1.6 1.6 3.4-3.6"/></svg>;
    case "cloud": return <svg {...props}><path d="M6 18h11a4 4 0 0 0 .7-7.9A6 6 0 0 0 6.3 8.5 4.8 4.8 0 0 0 6 18Z"/></svg>;
  }
}
