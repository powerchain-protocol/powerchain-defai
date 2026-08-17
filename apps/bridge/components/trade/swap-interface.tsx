"use client";
import { TransactionCompleted } from "@/components/transactions/completed";
import { TransactionMessage } from "@/components/transactions/messages";
import { TransactionConfirmations } from "@/components/transactions/confirmations";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { useConnectedWallets } from "@/lib/wallet/connected-wallets";
import { requireConnectedPayer } from "@/lib/payments/payer";
import { suiscanTransactionUrl } from "@/lib/explorers/links";
import { configuredSwapAssets, type SwapAsset, type SwapQuote } from "@/lib/swap/swap";
import { useSlippageTolerance } from "@/hooks/use-slippage-tolerance";
import { SwapSettings } from "./swap-settings";
import { useUserSettings } from "@/context/user-settings-context";
import { apiFetch } from "@/lib/api/browser-api";
import { TokenPicker, type TokenPickerItem } from "@/components/assets/token-picker";
import { CryptoAssetIcon } from "@/components/assets/crypto-asset-icon";
import { SwapIcon } from "@/components/icons/swap-icon";
import { Button } from "@/components/ui/button";

function toBaseUnits(value: string, decimals: number): string | null {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const [whole = "0", fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) return null;
  const raw = `${whole}${fraction.padEnd(decimals, "0")}`.replace(/^0+(?=\d)/, "");
  return BigInt(raw || "0").toString();
}

function fromBaseUnits(value: string, decimals: number): string {
  if (!/^\d+$/.test(value)) return "—";
  const padded = value.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals) || "0";
  const fraction = decimals ? padded.slice(-decimals).replace(/0+$/, "") : "";
  return fraction ? `${whole}.${fraction}` : whole;
}

function shortAddress(value: string): string {
  return value.length > 16 ? `${value.slice(0, 7)}…${value.slice(-6)}` : value;
}

function deviationLabel(value: number | null): { text: string; tone: string } | null {
  if (value === null || !Number.isFinite(value)) return null;
  const percentage = Math.abs(value) * 100;
  const text = `${percentage < 0.01 ? "<0.01" : percentage.toFixed(2)}%`;
  if (percentage >= 3) return { text, tone: "text-rose-700 dark:text-rose-300" };
  if (percentage >= 1) return { text, tone: "text-amber-700 dark:text-amber-300" };
  return { text, tone: "text-[#294a3b] dark:text-[#d0dcd6]" };
}

function AssetIcon({ asset }: { asset: SwapAsset }) {
  return <CryptoAssetIcon token={asset} size={32} />;
}

function pickerAsset(asset: SwapAsset): TokenPickerItem {
  return { id: asset.id, symbol: asset.symbol, name: asset.name, chain: "SUI", address: asset.coinType, ...(asset.icon ? { icon: asset.icon } : {}) };
}

function parseEnvelope(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function parseQuote(value: unknown): SwapQuote | null {
  const root = parseEnvelope(value);
  const data = parseEnvelope(root?.data);
  if (!data) return null;
  const providers = Array.isArray(data.providers) && data.providers.every((item: unknown) => typeof item === "string") ? data.providers as string[] : null;
  if (!providers || typeof data.quoteId !== "string" || typeof data.payer !== "string" || typeof data.fromCoinType !== "string" || typeof data.toCoinType !== "string" || typeof data.amountInBaseUnits !== "string" || typeof data.amountOutBaseUnits !== "string" || typeof data.minimumOutBaseUnits !== "string" || typeof data.slippageBps !== "number" || typeof data.protocolFeeReceiver !== "string" || typeof data.expiresAt !== "string") return null;
  return {
    quoteId: data.quoteId,
    payer: data.payer,
    fromCoinType: data.fromCoinType,
    toCoinType: data.toCoinType,
    amountInBaseUnits: data.amountInBaseUnits,
    amountOutBaseUnits: data.amountOutBaseUnits,
    minimumOutBaseUnits: data.minimumOutBaseUnits,
    slippageBps: data.slippageBps,
    providers,
    priceDeviationRatio: typeof data.priceDeviationRatio === "number" ? data.priceDeviationRatio : null,
    protocolFeeBps: 250,
    protocolFeeMode: "cetus-overlay",
    protocolFeeReceiver: data.protocolFeeReceiver,
    userPaysNetworkFees: true,
    sponsored: false,
    expiresAt: data.expiresAt,
    source: "cetus-aggregator",
  };
}

type SwapBalance = { asset: string; balanceBaseUnits: string; gasReserveRequired: boolean; checkedAt: string };

function parseBalance(value: unknown): SwapBalance | null {
  const root = parseEnvelope(value);
  const data = parseEnvelope(root?.data);
  if (!data || typeof data.asset !== "string" || typeof data.balanceBaseUnits !== "string" || !/^\d+$/.test(data.balanceBaseUnits) || typeof data.gasReserveRequired !== "boolean" || typeof data.checkedAt !== "string") return null;
  return { asset: data.asset, balanceBaseUnits: data.balanceBaseUnits, gasReserveRequired: data.gasReserveRequired, checkedAt: data.checkedAt };
}

function friendlySwapError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const text = raw.toLowerCase();
  if (text.includes("reject") || text.includes("cancel") || text.includes("denied")) return "Transaction cancelled in wallet. No swap was submitted.";
  if (raw.includes("SWAP_PRICE_PROTECTION_TRIGGERED")) return "Price moved beyond your protection limit. Refresh the quote and review again.";
  if (raw.includes("PAYER_CONNECTED_WALLET_MISMATCH")) return "Connected wallet changed. Reconnect or refresh before continuing.";
  if (raw.includes("SWAP_QUOTE_UNAVAILABLE")) return "Swap quote is temporarily unavailable. Check the route and try again.";
  if (raw.includes("SWAP_INSUFFICIENT_BALANCE")) return "Insufficient source-token balance for this swap amount.";
  if (raw.includes("SWAP_SUI_GAS_RESERVE_REQUIRED")) return "Keep some SUI available for network gas instead of swapping the entire SUI balance.";
  return "Swap is temporarily unavailable. No completion is assumed.";
}

export function SwapInterface() {
  const assets = useMemo(() => configuredSwapAssets(), []);
  const initialFrom = assets.find((asset) => asset.id === "wpwrc") ?? assets[0];
  const initialTo = assets.find((asset) => asset.id === "sui") ?? assets[1] ?? assets[0];
  const [from, setFrom] = useState<SwapAsset>(initialFrom);
  const [to, setTo] = useState<SwapAsset>(initialTo.id === initialFrom.id ? (assets.find((asset) => asset.id !== initialFrom.id) ?? initialTo) : initialTo);
  const [amount, setAmount] = useState("");
  const { slippageBps, setSlippageBps } = useSlippageTolerance();
  const { settings, updateSettings } = useUserSettings();
  const protection = settings.swap.mevProtection;
  const setProtection = (value: boolean) => updateSettings({ swap: { ...settings.swap, mevProtection: value } });
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "quoting" | "ready" | "signing" | "submitted" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [submittedDigest, setSubmittedDigest] = useState<string | null>(null);
  const [balance, setBalance] = useState<SwapBalance | null>(null);
  const [balanceState, setBalanceState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [now, setNow] = useState(() => Date.now());
  const timer = useRef<number | null>(null);
  const quoteController = useRef<AbortController | null>(null);
  const transactionController = useRef<AbortController | null>(null);
  const balanceController = useRef<AbortController | null>(null);
  const reviewDialogRef = useRef<HTMLElement | null>(null);
  const quoteGeneration = useRef(0);
  const wallets = useConnectedWallets();
  const dAppKit = useDAppKit();
  const amountBaseUnits = useMemo(() => toBaseUnits(amount, from.decimals), [amount, from.decimals]);
  const availableBaseUnits = balance?.asset === from.id ? BigInt(balance.balanceBaseUnits) : null;
  const requestedBaseUnits = amountBaseUnits ? BigInt(amountBaseUnits) : null;
  const insufficientBalance = Boolean(availableBaseUnits !== null && requestedBaseUnits !== null && requestedBaseUnits > availableBaseUnits);
  const suiGasReserveRequired = Boolean(from.id === "sui" && availableBaseUnits !== null && requestedBaseUnits !== null && requestedBaseUnits > 0n && requestedBaseUnits >= availableBaseUnits);
  const balanceReady = balanceState === "ready" && availableBaseUnits !== null;
  const canQuote = Boolean(wallets.suiAddress && requestedBaseUnits && requestedBaseUnits > 0n && from.id !== to.id && assets.length > 1 && balanceReady && !insufficientBalance && !suiGasReserveRequired);
  const expiresInSeconds = quote ? Math.max(0, Math.ceil((Date.parse(quote.expiresAt) - now) / 1000)) : 0;
  const quoteExpired = Boolean(quote && expiresInSeconds <= 0);
  const deviation = quote ? deviationLabel(quote.priceDeviationRatio) : null;

  useEffect(() => {
    if (!quote) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [quote]);

  useEffect(() => {
    if (!quote || quoteExpired) setReviewOpen(false);
  }, [quote, quoteExpired]);

  useEffect(() => {
    if (!reviewOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = reviewDialogRef.current;
    const focusable = dialog?.querySelector<HTMLElement>("button:not([disabled])");
    focusable?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && status !== "signing") setReviewOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [reviewOpen, status]);

  useEffect(() => () => {
    quoteController.current?.abort();
    transactionController.current?.abort();
    balanceController.current?.abort();
  }, []);

  const loadBalance = useCallback(async () => {
    if (!wallets.suiAddress) { setBalance(null); setBalanceState("idle"); return; }
    balanceController.current?.abort();
    const controller = new AbortController();
    balanceController.current = controller;
    setBalanceState("loading");
    try {
      const params = new URLSearchParams({ address: wallets.suiAddress, asset: from.id });
      const response = await apiFetch(`/api/v1/swap/balance?${params.toString()}`, { cache: "no-store", signal: controller.signal });
      const body: unknown = await response.json();
      const next = parseBalance(body);
      if (!response.ok || !next || next.asset !== from.id) throw new Error("SWAP_BALANCE_UNAVAILABLE");
      if (controller.signal.aborted) return;
      setBalance(next);
      setBalanceState("ready");
    } catch {
      if (controller.signal.aborted) return;
      setBalance(null);
      setBalanceState("error");
    }
  }, [wallets.suiAddress, from.id]);

  useEffect(() => { void loadBalance(); return () => balanceController.current?.abort(); }, [loadBalance]);

  const loadQuote = useCallback(async () => {
    if (!wallets.suiAddress || !amountBaseUnits || BigInt(amountBaseUnits) <= 0n || from.id === to.id || !balanceReady || insufficientBalance || suiGasReserveRequired) return;
    quoteController.current?.abort();
    const controller = new AbortController();
    quoteController.current = controller;
    const generation = ++quoteGeneration.current;
    setReviewOpen(false);
    setStatus("quoting");
    setMessage(null);
    setSubmittedDigest(null);
    try {
      const payer = requireConnectedPayer({ chain: "SUI", requestedPayer: wallets.suiAddress, connectedSuiAddress: wallets.suiAddress, connectedSolanaAddress: wallets.solanaAddress });
      const response = await apiFetch("/api/v1/swap/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ payer, fromCoinType: from.coinType, toCoinType: to.coinType, amountBaseUnits, slippageBps: protection ? Math.min(slippageBps, 100) : slippageBps }),
      });
      const body: unknown = await response.json();
      const next = parseQuote(body);
      if (!response.ok || !next) throw new Error("SWAP_QUOTE_UNAVAILABLE");
      if (generation !== quoteGeneration.current) return;
      setNow(Date.now());
      setQuote(next);
      setStatus("ready");
    } catch (error) {
      if (controller.signal.aborted || generation !== quoteGeneration.current) return;
      setQuote(null);
      setStatus("error");
      setMessage(friendlySwapError(error));
    }
  }, [wallets.suiAddress, wallets.solanaAddress, amountBaseUnits, from, to, slippageBps, protection, balanceReady, insufficientBalance, suiGasReserveRequired]);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    quoteController.current?.abort();
    setQuote(null);
    setReviewOpen(false);
    if (!canQuote) return;
    timer.current = window.setTimeout(() => void loadQuote(), 350);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      quoteController.current?.abort();
    };
  }, [canQuote, loadQuote]);

  const swapAssets = () => {
    const next = from;
    setFrom(to);
    setTo(next);
    setQuote(null);
    setReviewOpen(false);
    setMessage(null);
  };

  const execute = async () => {
    if (!quote || !wallets.suiAddress || !amountBaseUnits) return;
    if (quoteExpired) {
      setReviewOpen(false);
      setStatus("error");
      setMessage("Quote expired. Refresh it before signing.");
      return;
    }
    transactionController.current?.abort();
    const controller = new AbortController();
    transactionController.current = controller;
    setStatus("signing");
    setMessage(null);
    try {
      const payer = requireConnectedPayer({ chain: "SUI", requestedPayer: quote.payer, connectedSuiAddress: wallets.suiAddress, connectedSolanaAddress: wallets.solanaAddress });
      const response = await apiFetch("/api/v1/swap/transaction", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ payer, fromCoinType: from.coinType, toCoinType: to.coinType, amountBaseUnits, slippageBps: quote.slippageBps, minimumOutBaseUnits: quote.minimumOutBaseUnits }),
      });
      const payload: unknown = await response.json();
      const root = parseEnvelope(payload);
      const data = parseEnvelope(root?.data);
      if (!response.ok || !data || typeof data.transactionBase64 !== "string") throw new Error("SWAP_TRANSACTION_PREPARE_FAILED");
      if (controller.signal.aborted) return;
      const transaction = Transaction.from(data.transactionBase64);
      const result = await dAppKit.signAndExecuteTransaction({ transaction });
      if (result.FailedTransaction) throw new Error(result.FailedTransaction.status.error?.message ?? "SWAP_TRANSACTION_FAILED");
      setReviewOpen(false);
      setStatus("submitted");
      setSubmittedDigest(result.Transaction.digest);
      void apiFetch("/api/v1/swap/receipt",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chain:"SUI",provider:"cetus",payer,inputAsset:from.coinType,outputAsset:to.coinType,inputBaseUnits:amountBaseUnits,quotedOutputBaseUnits:quote.amountOutBaseUnits,minimumOutputBaseUnits:quote.minimumOutBaseUnits,slippageBps:quote.slippageBps,transactionDigest:result.Transaction.digest})}).catch(()=>undefined);
      setMessage("Swap transaction submitted. Verify execution status before treating the operation as final.");
      setQuote(null);
      setAmount("");
      void loadBalance();
    } catch (error) {
      if (controller.signal.aborted) return;
      setStatus("error");
      setMessage(friendlySwapError(error));
    }
  };

  if (assets.length < 2) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"><p className="font-semibold">Swap assets not configured</p><p className="mt-1 text-xs leading-5">Configure wPWRC and at least one Sui swap asset. The app does not invent coin types.</p></div>;
  }

  return (
    <section className="pc-card rounded-[28px] border border-slate-200 bg-white p-3 text-slate-950 shadow-[0_12px_38px_rgba(7,16,13,.06)] dark:border-white/10 dark:bg-[#07100d] dark:text-white sm:p-4" aria-label="PowerChain swap" aria-busy={status === "quoting" || status === "signing"}>
      <div className="flex items-center justify-between gap-3 px-1 pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#557568] dark:text-[#d0dcd6]">Sui liquidity</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Swap</h2>
        </div>
        <SwapSettings slippageBps={slippageBps} onSlippageChange={(bps) => { setSlippageBps(bps); setQuote(null); }} protection={protection} onProtectionChange={(value) => { setProtection(value); setQuote(null); }} />
      </div>

      <div className="relative z-10 space-y-2 rounded-[22px] border border-slate-200 bg-[#fbfcfb] p-3 text-slate-950 dark:border-white/10 dark:bg-black/20 dark:text-white">
        <div className="rounded-[var(--pc-radius-card)] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[.035]">
          <div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-slate-500">You pay</span><div className="flex items-center gap-2 text-[11px] text-slate-500"><span>{balanceState === "loading" ? "Balance…" : balanceReady && balance ? `${fromBaseUnits(balance.balanceBaseUnits, from.decimals)} ${from.symbol}` : balanceState === "error" ? "Balance unavailable" : "Sui network"}</span>{balanceReady && balance && from.id !== "sui" && BigInt(balance.balanceBaseUnits) > 0n ? <Button variant="ghost" size="sm" onClick={() => { setAmount(fromBaseUnits(balance.balanceBaseUnits, from.decimals)); setMessage(null); }} className="min-h-7 px-2 text-[#294a3b] dark:text-[#d0dcd6]">Max</Button> : null}</div></div>
          <div className="mt-3 flex items-center gap-3">
            <input value={amount} onChange={(event) => { setAmount(event.target.value); setMessage(null); }} inputMode="decimal" placeholder="0.0" className="min-w-0 flex-1 bg-transparent text-3xl font-semibold outline-none" aria-label="Swap amount" aria-invalid={insufficientBalance || suiGasReserveRequired} aria-describedby={insufficientBalance || suiGasReserveRequired ? "swap-balance-warning" : undefined} />
            <TokenPicker items={assets.map(pickerAsset)} value={pickerAsset(from)} disabledIds={[to.id]} label="Source token" onChange={(item) => { const asset = assets.find((candidate) => candidate.id === item.id); if (asset) setFrom(asset); }} />
          </div>
          {insufficientBalance ? <p id="swap-balance-warning" role="alert" className="mt-2 text-[11px] font-semibold text-rose-700 dark:text-rose-300">Insufficient {from.symbol} balance for this amount.</p> : suiGasReserveRequired ? <p id="swap-balance-warning" role="alert" className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Keep some SUI in the wallet for network gas.</p> : from.id === "sui" && balanceReady ? <p className="mt-2 text-[11px] text-slate-500">SUI is also used for network gas, so an exact Max action is intentionally unavailable.</p> : null}
        </div>

        <div className="relative h-0"><Button variant="secondary" size="icon" onClick={swapAssets} aria-label="Switch swap assets" className="absolute left-1/2 top-[-21px] -translate-x-1/2 border-4 border-white bg-[#eef3f0] text-[#173b2d] shadow-[0_10px_26px_rgba(7,16,13,.14)] hover:-translate-y-0.5 hover:scale-[1.03] dark:border-[#07100d] dark:bg-[#102b21] dark:text-white"><SwapIcon className="size-5"/></Button></div>

        <div className="rounded-[var(--pc-radius-card)] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[.035]">
          <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">You receive</span>{quote ? <span className={`text-[11px] font-semibold ${quoteExpired ? "text-rose-600 dark:text-rose-300" : expiresInSeconds <= 10 ? "text-amber-600 dark:text-amber-300" : "text-[#294a3b] dark:text-[#d0dcd6]"}`}>{quoteExpired ? "Quote expired" : `Quote · ${expiresInSeconds}s`}</span> : null}</div>
          <div className="mt-3 flex items-center justify-between gap-3"><strong className="min-w-0 flex-1 truncate text-3xl font-semibold">{quote ? fromBaseUnits(quote.amountOutBaseUnits, to.decimals) : "—"}</strong><TokenPicker items={assets.map(pickerAsset)} value={pickerAsset(to)} disabledIds={[from.id]} label="Destination token" onChange={(item) => { const asset = assets.find((candidate) => candidate.id === item.id); if (asset) setTo(asset); }} /></div>
        </div>

        <div className="rounded-[var(--pc-radius-control)] border border-slate-200 p-3.5 text-xs dark:border-white/10">
          <div className="grid gap-2 sm:grid-cols-2">
            <p className="flex justify-between gap-4"><span className="text-slate-500">Slippage</span><strong>{(slippageBps / 100).toFixed(2)}%</strong></p>
            <p className="flex justify-between gap-4"><span className="text-slate-500">PowerChain fee</span><strong>2.5%</strong></p>
            <p className="flex justify-between gap-4"><span className="text-slate-500">Minimum received</span><strong>{quote ? `${fromBaseUnits(quote.minimumOutBaseUnits, to.decimals)} ${to.symbol}` : "—"}</strong></p>
            <p className="flex justify-between gap-4"><span className="text-slate-500">Network fee payer</span><strong>Connected wallet</strong></p>
            {deviation ? <p className="flex justify-between gap-4 sm:col-span-2"><span className="text-slate-500">Aggregator route deviation</span><strong className={deviation.tone}>{deviation.text}</strong></p> : null}
          </div>
          {quote ? <div className="mt-3 border-t border-slate-200 pt-3 dark:border-white/10"><div className="flex items-center justify-between gap-3"><p className="text-slate-500">Route</p><span className="rounded-full bg-[#f1f4f2] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#294a3b] dark:bg-[#09110e]/50 dark:text-[#d0dcd6]">{protection ? "Protected" : "Standard"}</span></div><p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{quote.providers.join(" → ") || "Cetus Aggregator"}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Cetus overlay fee is included in the quoted output. No sponsored gas: your connected wallet signs and pays Sui network gas.</p></div> : null}
        </div>

        {!wallets.suiConnected ? <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Connect a Sui wallet to quote and sign swaps.</div> : balanceState === "error" ? <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><span>Balance preflight is unavailable. Quotes stay disabled until the source balance can be verified.</span><Button variant="ghost" size="sm" onClick={() => void loadBalance()} className="min-h-8 shrink-0 px-2">Retry</Button></div> : null}
        {status === "submitted" && submittedDigest ? <TransactionCompleted chain="SUI" digest={submittedDigest} explorerUrl={suiscanTransactionUrl(submittedDigest)} label="Swap transaction submitted" finalityNotice="Verify execution status before treating the operation as confirmed. Bridge settlement uses separate finality and reconciliation evidence." /> : message ? <TransactionMessage tone="error">{message}</TransactionMessage> : null}

        <Button variant="primary" size="lg" onClick={quoteExpired ? () => void loadQuote() : quote ? () => setReviewOpen(true) : () => void loadQuote()} disabled={!canQuote || status === "signing"} loading={status === "quoting" || status === "signing"} loadingLabel={status === "quoting" ? "Getting quote…" : "Confirm in wallet…"} className="w-full">
          {quoteExpired ? "Refresh quote" : quote ? "Review & swap" : "Get swap quote"}
        </Button>
      </div>

      {reviewOpen && quote && wallets.suiAddress ? (
        <div className="fixed inset-0 z-[80] grid items-end bg-black/45 p-3 backdrop-blur-[3px] sm:place-items-center" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target && status !== "signing") setReviewOpen(false); }}>
          <section ref={reviewDialogRef} className="pc-review-sheet w-full max-w-md rounded-[26px] p-4 text-slate-950 dark:text-white sm:p-5" role="dialog" aria-modal="true" aria-labelledby="swap-review-title">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#557568] dark:text-[#b9c8c1]">Wallet confirmation</p><h3 id="swap-review-title" className="mt-1 text-xl font-semibold tracking-tight">Review swap</h3><p className="mt-1 text-xs leading-5 text-slate-500">Check the protected output and payer before opening your wallet.</p></div>
              <Button variant="secondary" size="icon" onClick={() => setReviewOpen(false)} disabled={status === "signing"} className="size-9 shrink-0 text-lg" aria-label="Close swap review">×</Button>
            </div>

            <div className="mt-4 rounded-2xl border pc-hairline bg-white/65 p-4 dark:bg-white/[.025]">
              <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2"><AssetIcon asset={from} /><div><p className="text-[10px] text-slate-500">You pay</p><p className="font-semibold">{amount} {from.symbol}</p></div></div><span className="text-slate-400">→</span><div className="flex items-center gap-2 text-right"><div><p className="text-[10px] text-slate-500">You receive</p><p className="font-semibold">{fromBaseUnits(quote.amountOutBaseUnits, to.decimals)} {to.symbol}</p></div><AssetIcon asset={to} /></div></div>
            </div>

            <dl className="mt-3 divide-y divide-slate-200/80 rounded-2xl border pc-hairline bg-white/45 px-4 dark:divide-white/8 dark:bg-white/[.02]">
              <div className="flex items-center justify-between gap-4 py-3 text-xs"><dt className="text-slate-500">Minimum received</dt><dd className="font-semibold">{fromBaseUnits(quote.minimumOutBaseUnits, to.decimals)} {to.symbol}</dd></div>
              <div className="flex items-center justify-between gap-4 py-3 text-xs"><dt className="text-slate-500">PowerChain fee</dt><dd className="font-semibold">2.5% · included</dd></div>
              <div className="flex items-center justify-between gap-4 py-3 text-xs"><dt className="text-slate-500">Slippage</dt><dd className="font-semibold">{(quote.slippageBps / 100).toFixed(2)}%</dd></div>
              <div className="flex items-center justify-between gap-4 py-3 text-xs"><dt className="text-slate-500">Route</dt><dd className="max-w-[58%] truncate text-right font-semibold">{quote.providers.join(" → ") || "Cetus Aggregator"}</dd></div>
              <div className="flex items-center justify-between gap-4 py-3 text-xs"><dt className="text-slate-500">Payer & signer</dt><dd className="font-mono font-semibold">{shortAddress(wallets.suiAddress)}</dd></div>
              <div className="flex items-center justify-between gap-4 py-3 text-xs"><dt className="text-slate-500">Sui gas</dt><dd className="font-semibold">Paid by your wallet</dd></div>
            </dl>

            <TransactionConfirmations items={[
              {id:"quote",label:"Quote fresh",ok:!quoteExpired},
              {id:"payer",label:"Connected payer matches quote",ok:quote.payer.toLowerCase()===wallets.suiAddress.toLowerCase()},
              {id:"balance",label:"Source balance verified",ok:balanceReady&&!insufficientBalance&&!suiGasReserveRequired},
              {id:"gas",label:"User pays network gas",ok:quote.userPaysNetworkFees&&!quote.sponsored},
            ]} />

            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#f1f4f2] px-3 py-2.5 text-[11px] text-[#294a3b] dark:bg-white/[.045] dark:text-[#d0dcd6]"><span>{protection ? "Minimum-output protection enabled" : "Standard slippage protection"}</span><strong>{quoteExpired ? "Expired" : `${expiresInSeconds}s`}</strong></div>

            <div className="mt-4 grid grid-cols-[.72fr_1.28fr] gap-2">
              <Button variant="secondary" onClick={() => setReviewOpen(false)} disabled={status === "signing"}>Back</Button>
              <Button variant="primary" onClick={() => void execute()} disabled={quoteExpired || !balanceReady || insufficientBalance || suiGasReserveRequired} loading={status === "signing"} loadingLabel="Opening wallet…">{quoteExpired ? "Quote expired" : "Confirm & open wallet"}</Button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
