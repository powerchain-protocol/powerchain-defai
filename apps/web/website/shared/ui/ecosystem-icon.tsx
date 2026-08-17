"use client";

import { NetworkIcon } from "@web3icons/react/dynamic";
import { useState } from "react";

const logos: Record<string, string> = {
  Pyth: "https://pyth.network/favicon.ico",
  Supabase: "https://supabase.com/favicon/favicon-32x32.png",
  Wormhole: "https://wormhole.com/favicon.ico",
  Jupiter: "https://jup.ag/favicon.ico",
  Cetus: "https://www.cetus.zone/favicon.ico",
  Cloudflare: "https://www.cloudflare.com/favicon.ico",
};

function PythFallback({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="Pyth">
      <rect width="32" height="32" rx="8" fill="#6C5CE7" />
      <path d="M9 8h8.2c4.2 0 6.8 2.3 6.8 6 0 3.8-2.6 6.2-6.9 6.2h-3.2V25H9V8Zm4.9 4v4.3h3c1.4 0 2.2-.8 2.2-2.2 0-1.3-.8-2.1-2.2-2.1h-3Z" fill="#fff" />
    </svg>
  );
}

function SupabaseFallback({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="Supabase">
      <path d="M18.4 3.6c.7-1 2.3-.5 2.3.8v9.2h6.2c1.3 0 1.8 1.6.9 2.4L13.6 28.4c-.8.8-2.2.2-2.1-.9l.7-9.5H5.4c-1.2 0-1.8-1.5-1-2.4L18.4 3.6Z" fill="#3ECF8E" />
      <path d="M12.2 18h8.3L13.6 28.4c-.8.8-2.2.2-2.1-.9l.7-9.5Z" fill="#1FAE70" />
    </svg>
  );
}

export function EcosystemIcon({ name, size = 30 }: { name: string; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (name === "Solana") return <NetworkIcon network="solana" size={size} variant="branded" />;
  if (name === "Sui") return <NetworkIcon network="sui" size={size} variant="branded" />;
  if (failed && name === "Pyth") return <PythFallback size={size} />;
  if (failed && name === "Supabase") return <SupabaseFallback size={size} />;

  const src = logos[name];
  if (!src || failed) {
    return (
      <span className="grid place-items-center rounded-lg bg-[#edf2ef] text-[10px] font-extrabold text-[#173b2d] dark:bg-white/10 dark:text-white" style={{ width: size, height: size }} aria-label={name}>
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return <img src={src} alt={`${name} logo`} width={size} height={size} className="rounded-md object-contain" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
