import type { ReactNode } from "react";
import { MarketingShell } from "@/website/ui/shell";

export default function PagesLayout({ children }: { children: ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
