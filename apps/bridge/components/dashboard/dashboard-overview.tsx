"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { CheckCircledIcon, ClockIcon, ExclamationTriangleIcon, GlobeIcon, LightningBoltIcon, Link2Icon, LockClosedIcon } from "@/components/icons";
import { NavigationIcon, type NavigationIconName } from "@/components/navigation/navigation-icon";
import { SurfaceCard, SurfaceCardHeader } from "@/components/ui/surface-card";
import { APP_ROUTES, type AppRoute } from "@/config/app-routes";
import { useSuiWalletSnapshot } from "@/context/sui-wallet-context";
import { useUserSettings } from "@/context/user-settings-context";

const QUICK_ACTIONS: readonly { label: string; description: string; href: AppRoute; icon: NavigationIconName }[] = [
  { label: "AI Assistant", description: "Research routes, liquidity and risk before signing.", href: APP_ROUTES.chat, icon: "chat" },
  { label: "Swap", description: "Review Solana or Sui execution routes.", href: APP_ROUTES.swap, icon: "swap" },
  { label: "Bridge", description: "Prepare and monitor a Wormhole NTT transfer.", href: APP_ROUTES.bridge, icon: "bridge" },
  { label: "Wallet", description: "Inspect balances, positions and recent activity.", href: APP_ROUTES.wallet, icon: "wallet" },
];

const OPERATION_LINKS: readonly [AppRoute, string, string][] = [
  [APP_ROUTES.history, "Operation history", "Submitted, pending and recovery states."],
  [APP_ROUTES.integrations, "Provider readiness", "RPCs, DEXs, indexers and runtime services."],
  [APP_ROUTES.protocol, "Programs & contracts", "Source-controlled deployment evidence."],
  [APP_ROUTES.fees, "Fee policy", "Protocol, service and network fees remain separate."],
];

function MetricCard({ eyebrow, value, detail, tone = "neutral" }: { eyebrow: string; value: string; detail: string; tone?: "neutral" | "good" | "attention" }) {
  const icon = tone === "good" ? <CheckCircledIcon /> : tone === "attention" ? <ExclamationTriangleIcon /> : <ClockIcon />;
  const toneClass = tone === "good"
    ? "bg-[#edf4f0] text-[#315846] dark:bg-[#29483c]/20 dark:text-[#d0dcd6]"
    : tone === "attention"
      ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
      : "bg-slate-100 text-slate-600 dark:bg-white/[0.05] dark:text-slate-300";

  return (
    <SurfaceCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="pc-section-label">{eyebrow}</p>
          <p className="mt-2 text-xl font-semibold tracking-[-.02em] text-slate-950 dark:text-white">{value}</p>
        </div>
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${toneClass}`}>{icon}</span>
      </div>
      <p className="mt-2.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
    </SurfaceCard>
  );
}

function BoundaryRow({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-[#f7f8f7] p-3.5 dark:border-white/10 dark:bg-white/[0.035]">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-[#315846] shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-[#d0dcd6]">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const solana = useWallet();
  const sui = useSuiWalletSnapshot();
  const { settings } = useUserSettings();
  const solanaConnected = Boolean(solana.connected && solana.publicKey);
  const suiConnected = Boolean(sui.address);
  const connectedCount = Number(solanaConnected) + Number(suiConnected);
  const customEndpoints = Number(settings.connectivity.useCustomSolanaRpc) + Number(settings.connectivity.useCustomSuiRpc);

  return (
    <div className="mx-auto max-w-[1480px] space-y-6 pb-2">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,.55fr)]">
        <SurfaceCard className="overflow-hidden p-5 sm:p-7 lg:p-8">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#294a3b]/10 bg-[#eef4f1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#294a3b] dark:border-[#8ea69a]/15 dark:bg-[#29483c]/15 dark:text-[#d0dcd6]">Command center</span>
                <span className="rounded-full border border-slate-200 bg-[#f7f8f7] px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">Solana + Sui</span>
              </div>
              <h2 className="mt-5 max-w-3xl text-2xl font-semibold tracking-[-.03em] text-slate-950 sm:text-3xl lg:text-[2.25rem] lg:leading-[1.15] dark:text-white">One operational workspace for wallet-controlled DeFi.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px] dark:text-slate-400">Inspect connectivity, prepare transactions, monitor settlement and move between AI, Swap, Bridge and Staking without moving signing authority into the backend.</p>
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href={APP_ROUTES.chat} className="pc-button-primary inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold"><LightningBoltIcon />Open AI Assistant</Link>
              <Link href={APP_ROUTES.status} className="pc-button-light inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold"><GlobeIcon />Runtime status</Link>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5 sm:p-6">
          <SurfaceCardHeader eyebrow="Execution boundary" title="Non-custodial by construction" description="The interface prepares and verifies operations while wallets remain the signing authority." />
          <div className="mt-5 space-y-2.5">
            <BoundaryRow icon={<LockClosedIcon />} title="Wallet-controlled signing" detail="PowerChain does not introduce a backend signer or custody path." />
            <BoundaryRow icon={<Link2Icon />} title="Independent finality" detail="Completion follows verified settlement evidence rather than UI state." />
            <BoundaryRow icon={<CheckCircledIcon />} title="Explicit providers" detail="Custom RPC and API preferences stay visible, testable and reversible." />
          </div>
        </SurfaceCard>
      </section>

      <section aria-labelledby="dashboard-metrics-title">
        <SurfaceCardHeader
          eyebrow="Workspace health"
          title="Connectivity & configuration"
          action={<Link href={APP_ROUTES.settings} className="inline-flex min-h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#294a3b] shadow-sm transition hover:border-[#9eafa7] dark:border-white/10 dark:bg-white/[0.035] dark:text-[#d0dcd6]">Manage settings</Link>}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard eyebrow="Wallets" value={`${connectedCount}/2 connected`} detail={connectedCount === 2 ? "Solana and Sui signing contexts are available." : "Connect only the wallet needed for the current action."} tone={connectedCount ? "good" : "attention"} />
          <MetricCard eyebrow="Solana" value={solanaConnected ? "Connected" : "Disconnected"} detail={solanaConnected ? `${solana.publicKey?.toBase58().slice(0, 7)}…${solana.publicKey?.toBase58().slice(-5)}` : "Connect from the header before signing a Solana action."} tone={solanaConnected ? "good" : "neutral"} />
          <MetricCard eyebrow="Sui" value={suiConnected ? "Connected" : "Disconnected"} detail={suiConnected ? `${sui.walletName ?? "Sui wallet"} · ${sui.address?.slice(0, 8)}…${sui.address?.slice(-5)}` : "Sui dApp Kit remains isolated from Solana signing."} tone={suiConnected ? "good" : "neutral"} />
          <MetricCard eyebrow="Custom endpoints" value={customEndpoints ? `${customEndpoints} active` : "Canonical"} detail={customEndpoints ? "One or more user-defined RPC endpoints are active." : "Using configured PowerChain/default RPC endpoints."} tone={customEndpoints ? "attention" : "good"} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div>
          <SurfaceCardHeader eyebrow="Workspace" title="Continue your work" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href} className="block rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1ef] dark:focus-visible:ring-offset-[#050807]">
                <SurfaceCard interactive className="h-full p-4 sm:p-5">
                  <div className="flex items-start gap-3.5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-[#f4f6f5] text-[#294a3b] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#d0dcd6]"><NavigationIcon name={action.icon} className="size-5" /></span>
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{action.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{action.description}</p>
                    </div>
                  </div>
                </SurfaceCard>
              </Link>
            ))}
          </div>
        </div>

        <SurfaceCard className="p-4 sm:p-5" aria-label="Operational shortcuts">
          <SurfaceCardHeader eyebrow="Operations" title="Inspect before execution" />
          <div className="mt-4 divide-y divide-slate-100 dark:divide-white/10">
            {OPERATION_LINKS.map(([href, title, detail]) => (
              <Link key={href} href={href} className="group flex items-start justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-slate-800 transition group-hover:text-[#294a3b] dark:text-slate-200 dark:group-hover:text-[#d0dcd6]">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
                </div>
                <span aria-hidden="true" className="mt-0.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#557568] dark:text-slate-600">→</span>
              </Link>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
