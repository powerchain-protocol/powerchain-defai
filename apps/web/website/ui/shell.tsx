import type { ReactNode } from "react";
import { Footer } from "./footer";
import { Header } from "./header";

export function MarketingShell({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh overflow-x-hidden"><Header /><main>{children}</main><Footer /></div>;
}
