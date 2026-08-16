"use client";

export type WalletNetworkStateProps = {
  connected: boolean;
  address?: string | null;
  expectedNetwork: string;
  currentNetwork?: string | null;
  connecting?: boolean;
  onConnect?: () => void;
  onSwitchNetwork?: () => void;
};

const short = (value: string) => value.length <= 14 ? value : `${value.slice(0, 6)}…${value.slice(-5)}`;

export function WalletNetworkState({
  connected,
  address,
  expectedNetwork,
  currentNetwork,
  connecting = false,
  onConnect,
  onSwitchNetwork,
}: WalletNetworkStateProps) {
  const wrongNetwork = connected && currentNetwork && currentNetwork !== expectedNetwork;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" aria-label="Wallet status">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${connected && !wrongNetwork ? "bg-[#1c4334]" : wrongNetwork ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"}`} aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              {!connected ? "Wallet not connected" : wrongNetwork ? "Wrong network" : "Wallet ready"}
            </p>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            {!connected ? `Connect a wallet on ${expectedNetwork}.` : wrongNetwork ? `Switch from ${currentNetwork} to ${expectedNetwork}.` : address ? `${short(address)} · ${expectedNetwork}` : expectedNetwork}
          </p>
        </div>
        {!connected ? (
          <button type="button" onClick={onConnect} disabled={connecting} className="min-h-10 rounded-xl bg-[#0b1511] px-4 text-sm font-semibold text-white transition hover:bg-[#102019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] disabled:opacity-50 dark:bg-[#dfe7e3] dark:hover:bg-white">
            {connecting ? "Connecting…" : "Connect wallet"}
          </button>
        ) : wrongNetwork ? (
          <button type="button" onClick={onSwitchNetwork} className="min-h-10 rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Switch network
          </button>
        ) : null}
      </div>
    </section>
  );
}
