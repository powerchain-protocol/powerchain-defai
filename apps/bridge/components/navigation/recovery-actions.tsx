import Link from "next/link";
import { APP_ROUTES } from "@/config/app-routes";

type RecoveryActionsProps = Readonly<{
  includeHome?: boolean;
  className?: string;
}>;

const linkClass = "inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-[#9eafa7] hover:bg-slate-50 hover:text-[#264b3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900";

/** Shared, route-registry-backed recovery navigation for error and empty states. */
export function RecoveryActions({ includeHome = false, className = "" }: RecoveryActionsProps) {
  return (
    <nav aria-label="Recovery links" className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {includeHome ? <Link href={APP_ROUTES.home} className={linkClass}>Open PowerChain</Link> : null}
      <Link href={APP_ROUTES.history} className={linkClass}>View history</Link>
      <Link href={APP_ROUTES.status} className={linkClass}>Runtime status</Link>
    </nav>
  );
}
