import type { SVGProps } from "react";

export type NavigationIconName = "swap" | "bridge" | "history" | "wallet" | "claim" | "assets" | "fees" | "integrations" | "chat" | "staking" | "explorer";

function IconBase({ children, ...props }: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export function NavigationIcon({ name, className = "size-4" }: { name: NavigationIconName; className?: string }) {
  switch (name) {
    case "swap":
      return <IconBase className={className}><path d="M7 7h11l-3-3"/><path d="m18 7-3 3"/><path d="M17 17H6l3 3"/><path d="m6 17 3-3"/></IconBase>;
    case "bridge":
      return <IconBase className={className}><path d="M7 7h11l-3-3" /><path d="m18 7-3 3" /><path d="M17 17H6l3 3" /><path d="m6 17 3-3" /></IconBase>;
    case "explorer":
      return <IconBase className={className}><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /><path d="M8 11h6" /><path d="M11 8v6" /></IconBase>;
    case "history":
      return <IconBase className={className}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></IconBase>;
    case "wallet":
      return <IconBase className={className}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19a1 1 0 0 1 1 1v13H6.5A2.5 2.5 0 0 1 4 16.5z" /><path d="M4 8h15" /><path d="M15 12h5v4h-5a2 2 0 0 1 0-4Z" /></IconBase>;
    case "claim":
      return <IconBase className={className}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></IconBase>;
    case "assets":
      return <IconBase className={className}><path d="m12 3 8 4-8 4-8-4z" /><path d="m4 12 8 4 8-4" /><path d="m4 17 8 4 8-4" /></IconBase>;
    case "fees":
      return <IconBase className={className}><circle cx="8" cy="8" r="2.5" /><circle cx="16" cy="16" r="2.5" /><path d="m18 6-12 12" /></IconBase>;
    case "chat":
      return <IconBase className={className}><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /><path d="M8 9h8" /><path d="M8 13h5" /></IconBase>;
    case "staking":
      return <IconBase className={className}><circle cx="12" cy="12" r="8" /><path d="M12 7v10" /><path d="M9 10.5c0-1.1 1.2-2 3-2s3 .9 3 2-1 1.8-3 2-3 .9-3 2 1.2 2 3 2 3-.9 3-2" /></IconBase>;
    case "integrations":
      return <IconBase className={className}><path d="M8 3v4" /><path d="M16 3v4" /><path d="M5 7h14" /><path d="M7 7v4a5 5 0 0 0 10 0V7" /><path d="M12 16v5" /></IconBase>;
  }
}
