"use client";

import { useMemo, useState } from "react";
import { ArrowRightIcon, CheckCircledIcon, GlobeIcon } from "@radix-ui/react-icons";
import { NetworkIcon } from "@web3icons/react/dynamic";
import { Logo } from "@/website/shared/ui/logo";
import { buildAppHandoffUrl, resolveAppPath } from "@/website/lib/redirects";
import { createWalletAccessHandoff } from "@/website/lib/auth";
import { useWebsiteWallet } from "@/website/providers/wallet-provider";
import { useRuntimeDirectory } from "@/website/hooks/use-runtime-directory";
import { WalletConnectModal } from "@/website/wallet/wallet-connect-modal";

export function OpenAppGateway({ slug, resourceId, accessMode = "launch" }: { slug: string; resourceId?: string | null; accessMode?: "launch" | "wallet-access" }) {
  const [walletOpen, setWalletOpen] = useState(false);
  const { chain, clusterId, solanaAddress, suiAddress } = useWebsiteWallet();
  const { data } = useRuntimeDirectory();
  const connected = Boolean(chain === "SOLANA" ? solanaAddress : suiAddress);
  const path = resolveAppPath(slug, resourceId) ?? "/";
  const target = useMemo(() => accessMode === "wallet-access"
    ? createWalletAccessHandoff({ slug, id: resourceId, chain, clusterId })
    : buildAppHandoffUrl({ slug, id: resourceId, chain, clusterId }), [accessMode, chain, clusterId, resourceId, slug]);

  return (
    <main className="web-launch-page">
      <section className="web-launch-card">
        <div className="flex items-center justify-between gap-3"><Logo /><a href="/" className="web-text-button">Back to website</a></div>
        <div className="mt-10">
          <p className="web-eyebrow">PowerChain application</p>
          <h1 className="web-display mt-2 text-3xl font-semibold tracking-[-.035em] text-brand-950 dark:text-brand-100 sm:text-4xl">Open a wallet-controlled workspace.</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">Select your preferred chain context, optionally connect a wallet, and continue to <span className="font-semibold">{path}</span>. No signing happens on this handoff page.</p>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="web-launch-stat"><NetworkIcon network={chain === "SOLANA" ? "solana" : "sui"} variant="branded" size={23} /><span><b>{chain === "SOLANA" ? "Solana" : "Sui"}</b><small>{clusterId.split(":")[1]}</small></span></div>
          <div className="web-launch-stat"><CheckCircledIcon /><span><b>{connected ? "Wallet detected" : "Wallet optional"}</b><small>{connected ? "Ready for app handoff" : "Connect before or after launch"}</small></span></div>
          <div className="web-launch-stat"><GlobeIcon /><span><b>App status</b><small>{data?.app.reachable === true ? "Reachable" : data?.app.reachable === false ? "Health check failed" : "Verified in application"}</small></span></div>
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="web-button web-button-secondary flex-1" onClick={() => setWalletOpen(true)}>{connected ? "Manage wallet" : "Connect wallet"}</button>
          <a href={target} className="web-button web-button-primary flex-1 gap-2">Continue to app <ArrowRightIcon /></a>
        </div>
        {accessMode === "wallet-access" ? <p className="mt-4 rounded-xl border border-[#d4ddd8] bg-[#f7f9f8] p-3 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-400">A connected wallet is a wallet session signal, not proof of account identity. Authentication requiring address ownership must be completed with an explicit signed challenge in the application.</p> : null}
      </section>
      <WalletConnectModal open={walletOpen} onClose={() => setWalletOpen(false)} targetSlug={slug} resourceId={resourceId} />
    </main>
  );
}
