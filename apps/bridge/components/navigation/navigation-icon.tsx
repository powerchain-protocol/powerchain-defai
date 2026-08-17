import type { SVGProps } from "react";
import { DashboardIcon } from "@/components/icons/dashboard-icon";
import { SwapIcon } from "@/components/icons/swap-icon";
import { BridgeIcon } from "@/components/icons/bridge-icon";

export type NavigationIconName = "dashboard" | "swap" | "bridge" | "history" | "wallet" | "claim" | "assets" | "fees" | "integrations" | "chat" | "staking" | "explorer" | "status" | "protocol" | "settings" | "profile";

function IconBase({ children, ...props }: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export function NavigationIcon({ name, className = "size-4" }: { name: NavigationIconName; className?: string }) {
  switch (name) {
    case "dashboard":
      return <DashboardIcon className={className}/>;
    case "swap":
      return <SwapIcon className={className}/>;
    case "bridge":
      return <BridgeIcon className={className}/>;
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
    case "status":
      return <IconBase className={className}><path d="M4 18V6" /><path d="M8 18v-5" /><path d="M12 18V9" /><path d="M16 18v-8" /><path d="M20 18V4" /></IconBase>;
    case "integrations":
      return <IconBase className={className}><path d="M8 3v4" /><path d="M16 3v4" /><path d="M5 7h14" /><path d="M7 7v4a5 5 0 0 0 10 0V7" /><path d="M12 16v5" /></IconBase>;
    case "protocol":
      return <IconBase className={className}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5"/><path d="M12 12v9"/><path d="M8.5 5.2 16.5 10"/></IconBase>;
    case "settings":
      return <IconBase className={className}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.15.38.36.72.6 1 .29.32.67.52 1.1.6H21v4h-.09c-.43.08-.81.28-1.1.6-.24.28-.45.62-.6 1Z"/></IconBase>;
    case "profile":
      return <IconBase className={className}><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></IconBase>;
  }
}
