import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/config/app-routes";

export function BridgeClaimReadinessStrip({ claimStatus, runtimeReady = true, stale = false }: { claimStatus?: string | null; runtimeReady?: boolean; stale?: boolean }) {
  const blocked = !runtimeReady || stale;

  return (
    <Card as="section" className="p-4" aria-label="Bridge and claim readiness">
      <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bridge asset</div>
          <div className="mt-1 font-semibold">PWRC ↔ wPWRC</div>
          <div className="text-xs text-slate-500">Wormhole NTT · principal 1:1</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Claim</div>
          <div className="mt-1 font-semibold">{claimStatus || "Check eligibility"}</div>
          <div className="text-xs text-slate-500">Server-authoritative</div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Link
            href={APP_ROUTES.bridge}
            aria-disabled={blocked}
            tabIndex={blocked ? -1 : undefined}
            className={buttonClassName({
              variant: blocked ? "secondary" : "primary",
              size: "sm",
              className: blocked ? "pointer-events-none opacity-50" : undefined,
            })}
          >
            {blocked ? "Refresh required" : "Bridge"}
          </Link>
          <Link href={APP_ROUTES.claim} className={buttonClassName({ variant: "secondary", size: "sm" })}>Claim</Link>
        </div>
      </div>
    </Card>
  );
}
