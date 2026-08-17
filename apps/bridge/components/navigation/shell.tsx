import type { ReactNode } from "react";

export function Shell({ sidebar, header, footer, children, backgroundClass = "bg-transparent" }: { sidebar: ReactNode; header: ReactNode; footer: ReactNode; children: ReactNode; backgroundClass?: string }) {
  return (
    <div className={`flex h-dvh min-h-0 overflow-hidden ${backgroundClass}`}>
      {sidebar}
      <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0">{header}</div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        <div className="shrink-0">{footer}</div>
      </div>
    </div>
  );
}
