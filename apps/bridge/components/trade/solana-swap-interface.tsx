"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VersionedTransaction } from "@solana/web3.js";
import { SWAP_SLIPPAGE_PRESETS_BPS, formatSwapSlippagePercent } from "@powerchain/swap-core";
import { TransactionCompleted } from "@/components/transactions/completed";
import { TransactionMessage } from "@/components/transactions/messages";
import { TokenSelector } from "@/components/assets/token-selector";
import { SwapIcon } from "@/components/icons/swap-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useUserSettings } from "@/context/user-settings-context";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useSlippageTolerance } from "@/hooks/use-slippage-tolerance";
import { useTrustedTokens } from "@/hooks/use-trusted-tokens";
import { apiFetch } from "@/lib/api/browser-api";
import { solscanTransactionUrl } from "@/lib/explorers/links";
import { formatTokenAmount, toTokenBaseUnits, tokensForChain, type TrustedToken } from "@/lib/tokens/trusted-token-list";
import { useConnectedWallets } from "@/lib/wallet/connected-wallets";

type Order = {
  provider: "jupiter";
  requestId: string;
  transaction: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold?: string;
  priceImpactPct?: string;
  router?: string;
  gasless?: boolean;
  expireAt?: string | null;
  lastValidBlockHeight?: number | null;
  routePlan?: unknown[];
  payer: string;
  userPaysNetworkFees: true;
};

type SwapStatus = "idle" | "routing" | "ready" | "signing" | "submitted" | "error";

function unwrap<T>(value: unknown): T | null {
  return value && typeof value === "object" && "data" in value ? (value as { data?: T }).data ?? null : null;
}

function apiErrorCode(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") return fallback;
  const error = (value as { error?: unknown }).error;
  if (!error || typeof error !== "object") return fallback;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && /^[A-Z][A-Z0-9_]{2,95}$/.test(code) ? code : fallback;
}

function routeLabels(order: Order | null) {
  if (!order || !Array.isArray(order.routePlan)) return [];
  const names = new Set<string>();
  for (const step of order.routePlan) {
    if (!step || typeof step !== "object") continue;
    const info = (step as { swapInfo?: unknown }).swapInfo;
    if (info && typeof info === "object" && typeof (info as { label?: unknown }).label === "string") names.add((info as { label: string }).label);
  }
  return [...names];
}

function friendly(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/reject|cancel|denied/i.test(text)) return "Transaction cancelled in wallet. No Solana swap was submitted.";
  if (text.includes("PAYER_CONNECTED_WALLET_MISMATCH")) return "Connected wallet changed. Refresh the route before signing.";
  if (text.includes("JUPITER_CUSTOM_API_HOST_NOT_ALLOWED")) return "This Jupiter host is not allowed by the PowerChain deployment. Use api.jup.ag or ask the operator to allow your provider hostname.";
  if (text.includes("JUPITER_CUSTOM_API_HOST_UNSAFE")) return "Local and IP-literal Jupiter provider targets are blocked in production.";
  if (text.includes("JUPITER_CUSTOM_API_KEY_REQUIRED") || text.includes("JUPITER_CUSTOM_API_KEY_INVALID")) return "Check your session Jupiter API key in Settings.";
  if (text.includes("JUPITER_API_KEY")) return "Jupiter routing needs a server key or your session key in Settings.";
  if (text.includes("API_KEY_REQUIRED") || text.includes("API_KEY_INVALID")) return "Check the PowerChain API key for your selected custom API.";
  if (text.includes("INSUFFICIENT")) return "Insufficient source-token balance.";
  return "Solana swap is temporarily unavailable. No completion is assumed.";
}

export function SolanaSwapInterface() {
  const { settings } = useUserSettings();
  const wallets = useConnectedWallets();
  const trusted = useTrustedTokens();
  const portfolio = usePortfolio(wallets.solanaAddress, null);
  const tokens = useMemo(() => tokensForChain(trusted.tokens, "SOLANA"), [trusted.tokens]);
  const [fromId, setFromId] = useState("solana:sol");
  const [toId, setToId] = useState("solana:usdc");
  const [amount, setAmount] = useState("");
  const { slippageBps, setSlippageBps } = useSlippageTolerance();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<SwapStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  const effectiveSlippageBps = settings.swap.mevProtection ? Math.min(slippageBps, 100) : slippageBps;
  const from = tokens.find((token) => token.id === fromId) ?? tokens[0];
  const to = tokens.find((token) => token.id === toId) ?? tokens.find((token) => token.id !== from?.id) ?? tokens[0];
  const amountBase = from ? toTokenBaseUnits(amount, from.decimals) : null;
  const balance = portfolio.data?.balances.find((row) => row.tokenId === from?.id);
  const balanceBase = balance?.balanceBaseUnits ?? null;
  const insufficient = Boolean(amountBase && balanceBase !== null && BigInt(amountBase) > BigInt(balanceBase));
  const balanceReady = balanceBase !== null && portfolio.online && !portfolio.stale && !portfolio.error;
  const providers = routeLabels(order);
  const canRoute = Boolean(wallets.solanaAddress && amountBase && BigInt(amountBase) > 0n && !insufficient && balanceReady && from.id !== to.id);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    setOrder(null);
    setSignature(null);
    setStatus("idle");
    setMessage(null);
  }, [fromId, toId, amount, slippageBps, effectiveSlippageBps]);

  if (!from || !to || tokens.length < 2) {
    return <Card className="p-6 text-sm text-slate-500">Trusted Solana swap assets are not fully configured.</Card>;
  }

  async function getRoute() {
    if (!canRoute || !wallets.solanaAddress || !amountBase) return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setStatus("routing");
    setMessage(null);
    try {
      const response = await apiFetch("/api/v1/swap/solana/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: abort.signal,
        body: JSON.stringify({ payer: wallets.solanaAddress, inputMint: from.address, outputMint: to.address, amountBaseUnits: amountBase, slippageBps: effectiveSlippageBps }),
      });
      const body: unknown = await response.json();
      const next = unwrap<Order>(body);
      if (!response.ok || !next) throw new Error(apiErrorCode(body, "JUPITER_ORDER_UNAVAILABLE"));
      setOrder(next);
      setStatus("ready");
    } catch (error) {
      if (abort.signal.aborted) return;
      setStatus("error");
      setMessage(friendly(error));
    }
  }

  async function signAndExecute() {
    if (!order || !wallets.solanaAddress || !wallets.solanaSignTransaction || !amountBase) return;
    setStatus("signing");
    setMessage(null);
    try {
      if (order.payer !== wallets.solanaAddress) throw new Error("PAYER_CONNECTED_WALLET_MISMATCH");
      const tx = VersionedTransaction.deserialize(Uint8Array.from(atob(order.transaction), (char) => char.charCodeAt(0)));
      const signed = await wallets.solanaSignTransaction(tx);
      const signedTransaction = btoa(String.fromCharCode(...signed.serialize()));
      const response = await apiFetch("/api/v1/swap/solana/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          payer: wallets.solanaAddress,
          signedTransaction,
          requestId: order.requestId,
          lastValidBlockHeight: order.lastValidBlockHeight ?? null,
          inputMint: from.address,
          outputMint: to.address,
          amountBaseUnits: amountBase,
          slippageBps: effectiveSlippageBps,
          minimumOutputBaseUnits: order.otherAmountThreshold ?? null,
        }),
      });
      const body: unknown = await response.json();
      const data = unwrap<{ signature?: string }>(body);
      if (!response.ok || !data?.signature) throw new Error(apiErrorCode(body, "JUPITER_EXECUTE_FAILED"));
      setSignature(data.signature);
      setStatus("submitted");
    } catch (error) {
      setStatus("error");
      setMessage(friendly(error));
    }
  }

  function chooseFrom(token: TrustedToken) {
    setFromId(token.id);
    if (token.id === toId) {
      const replacement = tokens.find((item) => item.id !== token.id);
      if (replacement) setToId(replacement.id);
    }
  }

  function chooseTo(token: TrustedToken) {
    setToId(token.id);
    if (token.id === fromId) {
      const replacement = tokens.find((item) => item.id !== token.id);
      if (replacement) setFromId(replacement.id);
    }
  }

  return (
    <Card className="overflow-visible p-4 sm:p-5" aria-label="Solana swap">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="pc-icon-surface size-10" aria-hidden="true"><SwapIcon className="size-5" /></span>
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#557568] dark:text-[#b9c8c1]">Solana routing</p><h2 className="mt-0.5 text-xl font-semibold tracking-tight">Jupiter Swap V2</h2></div>
        </div>
        <Badge tone="info">Raydium · Meteora · Orca</Badge>
      </div>

      <div className="mt-5 space-y-2">
        <div className="rounded-[var(--pc-radius-card)] border border-slate-200 bg-[#f7f9f8] p-4 dark:border-white/10 dark:bg-black/20">
          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <label className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500" htmlFor="solana-swap-amount">You pay</label>
              <Input id="solana-swap-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="mt-2 min-h-0 border-0 bg-transparent px-0 text-3xl font-semibold tracking-tight shadow-none focus:shadow-none" />
            </div>
            <TokenSelector tokens={tokens} value={from} onChange={chooseFrom} label="Source token" disabledTokenIds={[to.id]} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Balance {portfolio.loading ? "…" : balanceBase === null ? "—" : formatTokenAmount(balanceBase, from.decimals)} {from.symbol}</span>
            {from.symbol !== "SOL" && balanceBase !== null && BigInt(balanceBase) > 0n ? <Button variant="ghost" size="sm" onClick={() => setAmount(formatTokenAmount(balanceBase, from.decimals, from.decimals))} className="min-h-7 px-2">Max</Button> : null}
          </div>
        </div>

        <Button variant="secondary" size="icon" aria-label="Switch tokens" onClick={() => { setFromId(to.id); setToId(from.id); }} className="relative z-20 mx-auto -my-5 border-4 border-white bg-[#eef3f0] text-[#173b2d] shadow-[0_10px_26px_rgba(7,16,13,.14)] hover:-translate-y-0.5 hover:scale-[1.03] dark:border-[#07100d] dark:bg-[#102b21] dark:text-white"><SwapIcon className="size-5" /></Button>

        <div className="rounded-[var(--pc-radius-card)] border border-slate-200 bg-[#f7f9f8] p-4 dark:border-white/10 dark:bg-black/20">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">You receive</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{order ? formatTokenAmount(order.outAmount, to.decimals) : "—"}</p></div>
            <TokenSelector tokens={tokens} value={to} onChange={chooseTo} label="Destination token" disabledTokenIds={[from.id]} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 rounded-[var(--pc-radius-control)] border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/[.035] dark:text-slate-300 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-3">Slippage <Select value={slippageBps} onChange={(event) => setSlippageBps(Number(event.target.value))} className="min-h-8 py-1 text-xs font-semibold text-[#294a3b] dark:text-white">{SWAP_SLIPPAGE_PRESETS_BPS.map((bps) => <option key={bps} value={bps}>{formatSwapSlippagePercent(bps)}</option>)}</Select></label>
        <span className="flex items-center justify-between"><span>Network fee</span><strong className="text-slate-900 dark:text-white">Paid by wallet</strong></span>
        {order ? <><span>Router <strong className="text-slate-900 dark:text-white">{order.router || "Jupiter"}</strong></span><span>Min received <strong className="text-slate-900 dark:text-white">{formatTokenAmount(order.otherAmountThreshold, to.decimals)} {to.symbol}</strong></span></> : null}
      </div>

      {providers.length ? <div className="mt-3 flex flex-wrap gap-1.5" aria-label="DEX route">{providers.map((name) => <Badge key={name} tone="neutral">{name}</Badge>)}</div> : null}
      {!portfolio.online ? <div className="mt-3"><TransactionMessage tone="warning">Portfolio verification is paused offline. Reconnect before requesting a route.</TransactionMessage></div> : portfolio.error ? <div className="mt-3"><TransactionMessage tone="warning">Source balance verification is temporarily unavailable. Refresh portfolio data before requesting a route.</TransactionMessage></div> : portfolio.stale ? <div className="mt-3"><TransactionMessage tone="warning">Source balance evidence is stale. Refresh before requesting a new route.</TransactionMessage></div> : null}
      {insufficient ? <div className="mt-3"><TransactionMessage tone="error">Insufficient {from.symbol} balance.</TransactionMessage></div> : null}
      {message ? <div className="mt-3"><TransactionMessage tone="error">{message}</TransactionMessage></div> : null}
      {signature ? <div className="mt-3"><TransactionCompleted chain="SOLANA" digest={signature} explorerUrl={solscanTransactionUrl(signature)} label="Swap transaction submitted" finalityNotice="Submission is not Bridge settlement finality." /></div> : null}

      <Button
        variant="primary"
        size="lg"
        disabled={!canRoute || status === "signing"}
        loading={status === "routing" || status === "signing"}
        loadingLabel={status === "routing" ? "Finding best route…" : "Confirm in wallet…"}
        onClick={order ? () => void signAndExecute() : () => void getRoute()}
        className="mt-5 w-full"
      >
        {!wallets.solanaAddress ? "Connect Solana wallet" : !balanceReady ? "Verify source balance" : order ? "Sign & execute swap" : "Review Solana route"}
      </Button>
      <p className="mt-3 text-center text-[10px] leading-4 text-slate-500">Jupiter assembles the route; the connected wallet signs it. {settings.jupiter.useCustomCredentials ? "Your session Jupiter credential is used for these requests." : "Server Jupiter credentials are used by default."} Pool and DEX labels are routing data, not bridge settlement evidence.</p>
    </Card>
  );
}
