"use client";

export function BridgeActionButton({
  state,
  onClick,
}: {
  state: "connect" | "wrong-network" | "offline" | "review" | "signing" | "submitting" | "disabled";
  onClick?: () => void;
}) {
  const map = {
    connect: "Connect wallet",
    "wrong-network": "Switch network",
    offline: "Reconnect to continue",
    review: "Review transfer",
    signing: "Waiting for signature…",
    submitting: "Submitting…",
    disabled: "Enter transfer details",
  } as const;
  const busy = state === "signing" || state === "submitting";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || state === "disabled" || state === "offline"}
      aria-busy={busy || undefined}
      className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0b1511] px-5 text-sm font-semibold text-white transition hover:bg-[#102019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#dfe7e3] dark:hover:bg-white"
    >
      {busy ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" /> : null}
      {map[state]}
    </button>
  );
}
