"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useUserSettings } from "@/context/user-settings-context";
import { useConnectedWallets } from "@/lib/wallet/connected-wallets";
import { decimalToBaseUnits } from "@/lib/bridge/base-units";
import { createIdempotencyKey, postBridgeAction } from "@/lib/actions/bridge-fetch";
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

function short(value: string | null) { return value ? `${value.slice(0, 7)}…${value.slice(-6)}` : "Not connected"; }

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
  const nttUrl = useMemo(() => { try { return readPowerChainNttTransferUrl(); } catch { return null; } }, []);

  async function requestQuote() {
    if (!sourceAddress || !destinationAddress) { setMessage("Connect both Solana and Sui wallets before requesting a bridge quote."); return; }
    let principalBaseUnits: string;
    try { principalBaseUnits = decimalToBaseUnits(amount).toString(); } catch (error) { setMessage(error instanceof Error ? error.message : "Enter a valid PWRC amount."); return; }
    setBusy(true); setMessage(null); setTransfer(null);
    try {
      const response = await postBridgeAction<Envelope<BridgeQuote>>("/api/v1/bridge/quote", { direction, principalBaseUnits, sourceAddress, destinationAddress });
      setQuote(response.data);
    } catch (error) { setQuote(null); setMessage(error instanceof Error ? error.message : "Bridge quote unavailable."); }
    finally { setBusy(false); }
  }

  async function trackSourceTransaction() {
    if (!quote) return;
    const tx = sourceTx.trim();
    if (!tx || tx.length > 128) { setMessage("Enter the wallet-approved source transaction signature/digest before tracking."); return; }
    setBusy(true); setMessage(null);
    try {
      const response = await postBridgeAction<Envelope<Transfer>>("/api/v1/bridge/transfers", {
        quoteId: quote.quoteId,
        intentCommitment: quote.intentCommitment,
        runtimeSnapshotId: quote.runtimeSnapshotId,
        sourceTx: tx,
      }, { idempotencyKey: createIdempotencyKey("ntt") });
      setTransfer(response.data);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to persist bridge transfer."); }
    finally { setBusy(false); }
  }

  return (
    <section className="pc-cinematic-panel pc-subtle-shine overflow-hidden rounded-[28px]" aria-labelledby="ntt-transfer-title">
      <div className="border-b border-white/10 px-4 py-4 text-white sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d0dcd6]">Native Token Transfer</p><h2 id="ntt-transfer-title" className="mt-1 text-xl font-semibold tracking-tight">{direction === "SUI_TO_SOLANA" ? "Bridge wPWRC → PWRC" : "Bridge PWRC → wPWRC"}</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">PowerChain binds the quote, source transaction, persisted status, finality and reconciliation. Wallet signing remains external to the server.</p></div>
          <div className="flex flex-wrap gap-2"><span className="rounded-full border border-[#c4d0ca]/25 bg-[#c7d4ce]/10 px-2.5 py-1 text-[11px] font-semibold text-[#e0e8e4]">{direction === "SUI_TO_SOLANA" ? "Sui → Solana" : "Solana → Sui"}</span><span className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-slate-200">Wormhole NTT · 1:1 principal</span></div>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex min-w-0 items-center gap-2.5"><Image src={direction === "SUI_TO_SOLANA" ? "/tokens/wpwrc.png" : "/tokens/pwrc.png"} alt="" width={42} height={42} className="size-10 shrink-0 rounded-full object-cover" /><div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-slate-400">Source</p><p className="truncate text-sm font-semibold">{short(sourceAddress)}</p></div></div>
          <span className="grid size-9 place-items-center rounded-full border border-[#c4d0ca]/25 bg-[#c7d4ce]/10 text-[#e0e8e4]" aria-hidden="true">→</span>
          <div className="flex min-w-0 items-center justify-end gap-2.5 text-right"><div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-slate-400">Destination</p><p className="truncate text-sm font-semibold">{short(destinationAddress)}</p></div><Image src={direction === "SUI_TO_SOLANA" ? "/tokens/pwrc.png" : "/tokens/wpwrc.png"} alt="" width={42} height={42} className="size-10 shrink-0 rounded-full object-cover" /></div>
        </div>
      </div>
      <div className="space-y-4 bg-white/92 p-4 backdrop-blur-xl sm:p-5 dark:bg-[#050807]/88">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><label className="block"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">PWRC principal</span><input className="pc-input mt-2 w-full rounded-xl px-3 py-2.5 text-sm" inputMode="decimal" value={amount} onChange={(event)=>{setAmount(event.target.value);setQuote(null);setTransfer(null);}} placeholder="0.0" /></label><button type="button" disabled={busy || !sourceAddress || !destinationAddress} onClick={()=>void requestQuote()} className="pc-button-dark self-end rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50">{busy?"Checking…":"Review quote"}</button></div>
        {quote ? <div className="rounded-2xl border border-slate-200 p-4 text-xs dark:border-white/10"><div className="grid gap-3 sm:grid-cols-3"><div><p className="text-slate-500">Principal</p><p className="mt-1 font-mono font-semibold">{quote.principalBaseUnits} base units</p></div><div><p className="text-slate-500">Service fee</p><p className="mt-1 font-mono font-semibold">{quote.serviceFeeBaseUnits}</p></div><div><p className="text-slate-500">Quote expires</p><p className="mt-1 font-semibold">{new Date(quote.expiresAt).toLocaleTimeString()}</p></div></div><p className="mt-3 break-all text-[10px] text-slate-500">Intent {quote.intentCommitment}</p></div> : null}
        {quote ? <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold">Wallet-signed source transaction</p><p className="mt-1 text-xs text-slate-500">Execute the reviewed NTT transfer in your approved wallet surface, then bind its signature/digest here. The server never signs.</p></div>{nttUrl ? <a href={nttUrl} target="_blank" rel="noopener noreferrer" className="pc-button-light rounded-xl px-3 py-2 text-xs font-semibold">Open NTT execution ↗</a> : <Link href="/settings" className="pc-button-light rounded-xl px-3 py-2 text-xs font-semibold">Configure execution URL</Link>}</div><div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]"><input className="pc-input w-full rounded-xl px-3 py-2.5 font-mono text-xs" value={sourceTx} onChange={(event)=>setSourceTx(event.target.value)} placeholder="Source transaction signature / digest" /><button type="button" disabled={busy || !sourceTx.trim()} onClick={()=>void trackSourceTransaction()} className="pc-button-dark rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-50">Track transfer</button></div></div> : null}
        {transfer ? <div className="rounded-2xl border border-[#b7c7bf] bg-[#f2f6f3] p-4 text-sm text-[#294a3b] dark:border-[#6d897c]/40 dark:bg-[#294a3b]/20 dark:text-[#d0dcd6]"><p className="font-semibold">Transfer persisted · {transfer.status}</p><p className="mt-1 break-all font-mono text-xs">{transfer.id}</p><Link href={`/bridge/status/${encodeURIComponent(transfer.id)}`} className="mt-3 inline-flex text-xs font-semibold underline underline-offset-4">Open live status</Link></div> : null}
        {message ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100">{message}</p> : null}
        {!sourceAddress || !destinationAddress ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">Connect both supported wallets. Bridge quotes are wallet-bound and cannot use invented recipient addresses.</p> : null}
      </div>
    </section>
  );
}
