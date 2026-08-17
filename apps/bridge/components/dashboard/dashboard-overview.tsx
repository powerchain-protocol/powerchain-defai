"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { CheckCircledIcon, ClockIcon, ExclamationTriangleIcon, GlobeIcon, LightningBoltIcon, Link2Icon, LockClosedIcon } from "@/components/icons";
import { APP_ROUTES, type AppRoute } from "@/config/app-routes";
import { useSuiWalletSnapshot } from "@/context/sui-wallet-context";
import { useUserSettings } from "@/context/user-settings-context";
import { NavigationIcon, type NavigationIconName } from "@/components/navigation/navigation-icon";

const QUICK_ACTIONS: readonly { label: string; description: string; href: AppRoute; icon: NavigationIconName }[] = [
  { label: "AI Assistant", description: "Research routes, liquidity and risk before signing.", href: APP_ROUTES.chat, icon: "chat" },
  { label: "Swap", description: "Review Solana or Sui execution routes.", href: APP_ROUTES.swap, icon: "swap" },
  { label: "Bridge", description: "Prepare a Wormhole NTT transfer.", href: APP_ROUTES.bridge, icon: "bridge" },
  { label: "Wallet", description: "Inspect balances, positions and activity.", href: APP_ROUTES.wallet, icon: "wallet" },
];

function MetricCard({ eyebrow, value, detail, tone = "neutral" }: { eyebrow: string; value: string; detail: string; tone?: "neutral" | "good" | "attention" }) {
  const icon = tone === "good" ? <CheckCircledIcon /> : tone === "attention" ? <ExclamationTriangleIcon /> : <ClockIcon />;
  const toneClass = tone === "good" ? "text-[#315846] bg-[#edf4f0] dark:bg-[#29483c]/20 dark:text-[#d0dcd6]" : tone === "attention" ? "text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300" : "text-slate-600 bg-slate-100 dark:bg-white/[0.05] dark:text-slate-300";
  return <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,.035)] dark:border-white/10 dark:bg-white/[0.035]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">{eyebrow}</p><p className="mt-2 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p></div><span className={`grid size-8 place-items-center rounded-xl ${toneClass}`}>{icon}</span></div><p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p></article>;
}

function BoundaryRow({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5"><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-[#d0dcd6]">{icon}</span><div><p className="text-sm font-semibold text-white">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p></div></div>;
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
    <div className="mx-auto max-w-[1440px] space-y-5 pb-2">
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,.06)] dark:border-white/10 dark:bg-[#0a0f0c]">
        <div className="grid lg:grid-cols-[1.35fr_.65fr]">
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-[#294a3b]/10 bg-[#294a3b]/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#294a3b] dark:border-[#8ea69a]/15 dark:bg-[#29483c]/15 dark:text-[#d0dcd6]">Command center</span><span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">Solana + Sui</span></div>
            <h2 className="mt-4 max-w-3xl text-2xl font-semibold tracking-[-.025em] text-slate-950 sm:text-3xl lg:text-[2.15rem] dark:text-white">A single operational view for wallet-controlled DeFi.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Inspect connectivity, prepare transactions, monitor finality and move between AI, Swap, Bridge and Staking without collapsing signing authority into the application backend.</p>
            <div className="mt-6 flex flex-wrap gap-2"><Link href={APP_ROUTES.chat} className="pc-button-primary inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold"><LightningBoltIcon />Open AI Assistant</Link><Link href={APP_ROUTES.status} className="pc-button-light inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold"><GlobeIcon />Runtime status</Link></div>
          </div>
          <div className="bg-[#07100d] p-5 text-white sm:p-6 lg:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b8c8c0]">Execution boundary</p><h3 className="mt-2 text-lg font-semibold">Non-custodial by construction</h3>
            <div className="mt-4 space-y-2.5"><BoundaryRow icon={<LockClosedIcon />} title="Wallets remain signing authority" detail="PowerChain does not introduce a backend signer or custody path."/><BoundaryRow icon={<Link2Icon />} title="Bridge finality is independent" detail="Completion is based on verified settlement evidence, not UI state."/><BoundaryRow icon={<CheckCircledIcon />} title="Providers are explicit" detail="Custom RPC/API preferences remain visible, testable and reversible."/></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="dashboard-metrics-title"><div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace health</p><h2 id="dashboard-metrics-title" className="mt-1 text-lg font-semibold tracking-tight">Connectivity & configuration</h2></div><Link href={APP_ROUTES.settings} className="text-xs font-semibold text-[#294a3b] hover:underline dark:text-[#d0dcd6]">Manage settings</Link></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard eyebrow="Wallets" value={`${connectedCount}/2 connected`} detail={connectedCount === 2 ? "Solana and Sui signing contexts are available." : "Connect only the wallet needed for the current action."} tone={connectedCount ? "good" : "attention"}/>
          <MetricCard eyebrow="Solana" value={solanaConnected ? "Connected" : "Disconnected"} detail={solanaConnected ? `${solana.publicKey?.toBase58().slice(0, 7)}…${solana.publicKey?.toBase58().slice(-5)}` : "Connect from the header before signing a Solana action."} tone={solanaConnected ? "good" : "neutral"}/>
          <MetricCard eyebrow="Sui" value={suiConnected ? "Connected" : "Disconnected"} detail={suiConnected ? `${sui.walletName ?? "Sui wallet"} · ${sui.address?.slice(0, 8)}…${sui.address?.slice(-5)}` : "Sui dApp Kit remains isolated from Solana signing."} tone={suiConnected ? "good" : "neutral"}/>
          <MetricCard eyebrow="Custom endpoints" value={customEndpoints ? `${customEndpoints} active` : "Canonical"} detail={customEndpoints ? "One or more user-defined RPC endpoints are active." : "Using configured PowerChain/default RPC endpoints."} tone={customEndpoints ? "attention" : "good"}/>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <div><div className="mb-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Continue your work</h2></div><div className="grid gap-3 sm:grid-cols-2">{QUICK_ACTIONS.map((action)=><Link key={action.href} href={action.href} className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,.035)] transition hover:-translate-y-0.5 hover:border-[#9eafa7] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-[#557568]/50"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-[#f4f6f5] text-[#294a3b] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#d0dcd6]"><NavigationIcon name={action.icon} className="size-5" /></span><div><p className="text-sm font-semibold text-slate-950 dark:text-white">{action.label}</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{action.description}</p></div></div></Link>)}</div></div>
        <aside className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,.035)] dark:border-white/10 dark:bg-white/[0.035]" aria-label="Operational shortcuts"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Operations</p><h2 className="mt-1 text-base font-semibold">Inspect before execution</h2><div className="mt-4 divide-y divide-slate-100 dark:divide-white/10">{[
          [APP_ROUTES.history,"Operation history","Submitted, pending and recovery states."],
          [APP_ROUTES.integrations,"Provider readiness","RPCs, DEXs, indexers and runtime services."],
          [APP_ROUTES.protocol,"Programs & contracts","Source-controlled deployment evidence."],
          [APP_ROUTES.fees,"Fee policy","Separate protocol/service and network fees."],
        ].map(([href,title,detail])=><Link key={href} href={href as AppRoute} className="block py-3 first:pt-0 last:pb-0"><p className="text-sm font-semibold text-slate-800 transition hover:text-[#294a3b] dark:text-slate-200 dark:hover:text-[#d0dcd6]">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></Link>)}</div></aside>
      </section>
    </div>
  );
}
