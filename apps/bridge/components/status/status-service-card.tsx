import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import type { StatusService } from "@/types/status";
import { formatRelativeAge } from "@/utils/helpers";
import { StatusIcon } from "./status-icon";

export function StatusServiceCard({ service }: { service: StatusService }) {
  return <Card className="h-full min-h-0">
    <CardHeader>
      <div className="flex min-w-0 items-start gap-3"><CardIcon><StatusIcon id={service.id}/></CardIcon><div className="min-w-0"><CardTitle>{service.label}</CardTitle><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{service.description}</p></div></div>
      <StatusBadge state={service.state}/>
    </CardHeader>
    <CardContent><div className="rounded-[var(--pc-radius-control)] border border-slate-200/80 bg-slate-50/80 px-3 py-3 dark:border-white/8 dark:bg-white/[.035]"><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{service.detail}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">{service.latencyMs !== undefined ? <span>{service.latencyMs} ms</span> : null}{service.updatedAt ? <span>Updated {formatRelativeAge(service.updatedAt)}</span> : <span>Waiting for evidence</span>}</div></div></CardContent>
  </Card>;
}
