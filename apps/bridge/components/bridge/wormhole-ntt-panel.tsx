"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { NetworkIcon } from "@web3icons/react/dynamic";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { APP_ROUTES, bridgeStatusRoute } from "@/config/app-routes";
import { useUserSettings } from "@/context/user-settings-context";
import { createIdempotencyKey, postBridgeAction, type BridgeActionError } from "@/lib/actions/bridge-fetch";
import { decimalToBaseUnits } from "@/lib/bridge/base-units";
import { useConnectedWallets } from "@/lib/wallet/connected-wallets";
import { readPowerChainNttTransferUrl } from "@/lib/wormhole/connect-config";

type BridgeQuote = {
  quoteId: string;
  direction: "SUI_TO_SOLANA" | "SOLANA_TO_SUI";
  principalBaseUnits: string;
  serviceFeeBaseUnits: string;
  totalSourceDebitBaseUnits: string;
  runtimeSnapshotId: string;
  intentCommitment: string;
  expiresAt: string;
};
type Envelope<T> = { data: T; requestId?: string };
type Transfer = { id: string; status: string; sourceTx?: string | null };

function short(value: string | null) {
  return value ? `${value.slice(0, 7)}…${value.slice(-6)}` : "Not connected";
}

function actionMessage(error: unknown, fallback: string) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as BridgeActionError).code) : "";
  if (code === "BRIDGE_ACTION_TIMEOUT_OR_ABORT") return "Bridge request timed out or was cancelled. Check transfer status before retrying.";
  if (code === "BRIDGE_ACTION_NETWORK_ERROR") return "Bridge service is temporarily unreachable. Check Runtime Status before retrying.";
  if (code === "QUOTE_EXPIRED") return "This quote expired. Request a fresh quote before continuing.";
  return fallback;
}

export function WormholeNttPanel() {
  const { settings } = useUserSettings();
  const wallets = useConnectedWallets();
  const direction = settings.bridge.defaultDirection;
  const sourceAddress = direction === "SUI_TO_SOLANA" ? wallets.suiAddress : wallets.solanaAddress;
  const destinationAddress = direction === "SUI_TO_SOLANA" ? wallets.solanaAddress : wallets.suiAddress;
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [sourceTx, setSourceTx] = useState("");
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const nttUrl = useMemo(() => {
    try { return readPowerChainNttTransferUrl(); } catch { return null; }
  }, []);

  async function requestQuote() {
    if (!sourceAddress || !destinationAddress) {
      setMessage("Connect both Solana and Sui wallets before requesting a bridge quote.");
      return;
    }
    let principalBaseUnits: string;
    try {
      principalBaseUnits = decimalToBaseUnits(amount).toString();
    } catch {
      setMessage("Enter a valid positive PWRC amount.");
      return;
    }
    setBusy(true);
    setMessage(null);
    setTransfer(null);
    try {
      const response = await postBridgeAction<Envelope<BridgeQuote>>("/api/v1/bridge/quote", {
        direction,
        principalBaseUnits,
        sourceAddress,
        destinationAddress,
      });
      setQuote(response.data);
    } catch (error) {
      setQuote(null);
      setMessage(actionMessage(error, "Bridge quote is temporarily unavailable. Refresh runtime status before retrying."));
    } finally {
      setBusy(false);
    }
  }

  async function trackSourceTransaction() {
    if (!quote) return;
    const tx = sourceTx.trim();
    if (!tx || tx.length > 128) {
      setMessage("Enter the wallet-approved source transaction signature or digest before tracking.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await postBridgeAction<Envelope<Transfer>>("/api/v1/bridge/transfers", {
        quoteId: quote.quoteId,
        intentCommitment: quote.intentCommitment,
        runtimeSnapshotId: quote.runtimeSnapshotId,
        sourceTx: tx,
      }, { idempotencyKey: createIdempotencyKey("ntt") });
      setTransfer(response.data);
    } catch (error) {
      setMessage(actionMessage(error, "Unable to persist this bridge transfer. Check History or Runtime Status before retrying."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card as="section" className="overflow-hidden shadow-[0_12px_38px_rgba(7,16,13,.06)]" aria-labelledby="ntt-transfer-title">
      <div className="border-b border-slate-200 bg-[#f7f9f8] px-4 py-4 dark:border-white/10 dark:bg-black/20 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#557568] dark:text-[#d0dcd6]">Native Token Transfer</p>
            <h2 id="ntt-transfer-title" className="mt-1 text-xl font-semibold tracking-tight">
              {direction === "SUI_TO_SOLANA" ? "Bridge wPWRC → PWRC" : "Bridge PWRC → wPWRC"}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
              PowerChain binds the quote, wallet-approved source transaction, persisted status, finality and reconciliation. The server never signs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">{direction === "SUI_TO_SOLANA" ? "Sui → Solana" : "Solana → Sui"}</Badge>
            <Badge>Wormhole NTT · 1:1 principal</Badge>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[var(--pc-radius-card)] border border-slate-200 bg-white p-3 shadow-[0_4px_16px_rgba(7,16,13,.035)] dark:border-white/10 dark:bg-white/[0.035] sm:gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-[var(--pc-radius-control)] border border-slate-200 bg-[#f2f6f3] text-[#173b2d] dark:border-white/10 dark:bg-white/[.05] dark:text-[#d0dcd6]"><NetworkIcon network={direction === "SUI_TO_SOLANA" ? "sui" : "solana"} size={20} variant="branded" /></span>
            <Image src={direction === "SUI_TO_SOLANA" ? "/tokens/wpwrc.png" : "/tokens/pwrc.png"} alt="" width={38} height={38} className="hidden size-9 shrink-0 rounded-full object-cover sm:block" />
            <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-slate-400">Source</p><p className="truncate text-sm font-semibold">{short(sourceAddress)}</p></div>
          </div>
          <span className="grid size-9 place-items-center rounded-full border border-[#cad8d1] bg-[#eef3f0] text-[#173b2d] dark:border-white/10 dark:bg-white/[.05] dark:text-[#d0dcd6]" aria-hidden="true">→</span>
          <div className="flex min-w-0 items-center justify-end gap-2.5 text-right">
            <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-slate-400">Destination</p><p className="truncate text-sm font-semibold">{short(destinationAddress)}</p></div>
            <Image src={direction === "SUI_TO_SOLANA" ? "/tokens/pwrc.png" : "/tokens/wpwrc.png"} alt="" width={38} height={38} className="hidden size-9 shrink-0 rounded-full object-cover sm:block" />
            <span className="grid size-9 shrink-0 place-items-center rounded-[var(--pc-radius-control)] border border-slate-200 bg-[#f2f6f3] text-[#173b2d] dark:border-white/10 dark:bg-white/[.05] dark:text-[#d0dcd6]"><NetworkIcon network={direction === "SUI_TO_SOLANA" ? "solana" : "sui"} size={20} variant="branded" /></span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 rounded-[var(--pc-radius-card)] border border-slate-200 bg-[#fbfcfb] p-3 dark:border-white/10 dark:bg-white/[.025] sm:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">PWRC principal</span>
            <Input className="mt-2" inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setQuote(null); setTransfer(null); }} placeholder="0.0" aria-describedby="ntt-principal-help" />
            <span id="ntt-principal-help" className="mt-1 block text-[11px] text-slate-500">Principal remains 1:1; service fee and network gas are separate.</span>
          </label>
          <Button variant="primary" className="self-end" disabled={!sourceAddress || !destinationAddress} loading={busy} loadingLabel="Checking…" onClick={() => void requestQuote()}>Review quote</Button>
        </div>

        {quote ? (
          <div className="rounded-[var(--pc-radius-card)] border border-slate-200 bg-white p-4 text-xs dark:border-white/10 dark:bg-white/[.025]">
            <div className="grid gap-3 sm:grid-cols-3">
              <div><p className="text-slate-500">Principal</p><p className="mt-1 font-mono font-semibold">{quote.principalBaseUnits} base units</p></div>
              <div><p className="text-slate-500">Service fee</p><p className="mt-1 font-mono font-semibold">{quote.serviceFeeBaseUnits}</p></div>
              <div><p className="text-slate-500">Quote expires</p><p className="mt-1 font-semibold">{new Date(quote.expiresAt).toLocaleTimeString()}</p></div>
            </div>
            <p className="mt-3 break-all text-[10px] text-slate-500">Intent {quote.intentCommitment}</p>
          </div>
        ) : null}

        {quote ? (
          <div className="rounded-[var(--pc-radius-card)] border border-slate-200 bg-[#fbfcfb] p-4 dark:border-white/10 dark:bg-white/[.025]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold">Wallet-signed source transaction</p>
                <p className="mt-1 text-xs text-slate-500">Execute the reviewed NTT transfer in your approved wallet surface, then bind its signature or digest here.</p>
              </div>
              {nttUrl ? (
                <a href={nttUrl} target="_blank" rel="noopener noreferrer" className={buttonClassName({ variant: "secondary", size: "sm" })}>Open NTT execution ↗</a>
              ) : (
                <Link href={APP_ROUTES.settings} className={buttonClassName({ variant: "secondary", size: "sm" })}>Configure execution URL</Link>
              )}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input className="font-mono text-xs" value={sourceTx} maxLength={128} onChange={(event) => setSourceTx(event.target.value)} placeholder="Source transaction signature / digest" />
              <Button variant="primary" size="sm" disabled={!sourceTx.trim()} loading={busy} loadingLabel="Tracking…" onClick={() => void trackSourceTransaction()}>Track transfer</Button>
            </div>
          </div>
        ) : null}

        {transfer ? (
          <InlineAlert title={`Transfer persisted · ${transfer.status}`} tone="success">
            <p className="break-all font-mono text-xs">{transfer.id}</p>
            <Link href={bridgeStatusRoute(transfer.id)} className="mt-2 inline-flex font-semibold underline underline-offset-4">Open live status</Link>
          </InlineAlert>
        ) : null}
        {message ? <InlineAlert title="Bridge action needs attention" tone="danger">{message}</InlineAlert> : null}
        {!sourceAddress || !destinationAddress ? <InlineAlert title="Connect both supported wallets" tone="warning">Bridge quotes are wallet-bound and cannot use invented recipient addresses.</InlineAlert> : null}
      </div>
    </Card>
  );
}
