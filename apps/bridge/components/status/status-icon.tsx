import { DashboardIcon } from "@/components/icons/dashboard-icon";
import type { StatusServiceId } from "@/types/status";

export function StatusIcon({ id, className = "size-4" }: { id: StatusServiceId; className?: string }) {
  if (id === "system") return <DashboardIcon className={className}/>;
  if (id === "solana" || id === "sui") return <span className="text-[9px] font-black tracking-[-.05em]" aria-label={id === "solana" ? "Solana" : "Sui"}>{id === "solana" ? "SOL" : "SUI"}</span>;
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className, "aria-hidden": true };
  if (id === "database") return <svg {...common}><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>;
  if (id === "workers") return <svg {...common}><path d="M12 3v4m0 10v4M3 12h4m10 0h4M5.6 5.6l2.8 2.8m7.2 7.2 2.8 2.8m0-12.8-2.8 2.8m-7.2 7.2-2.8 2.8"/><circle cx="12" cy="12" r="3.2"/></svg>;
  if (id === "queues") return <svg {...common}><path d="M5 7h14M5 12h10M5 17h7"/><circle cx="18" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="1" fill="currentColor" stroke="none"/></svg>;
  return <svg {...common}><path d="M4 7h8m4 0h4M4 17h4m4 0h8M12 4v6m-4 4v6m8-10v10"/><circle cx="12" cy="12" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="8" r="2"/></svg>;
}
