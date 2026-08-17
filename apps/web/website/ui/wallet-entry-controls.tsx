"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletConnectModal } from "@/website/wallet/wallet-connect-modal";
import { useWebsiteWallet } from "@/website/providers/wallet-provider";

function shortAddress(value: string) { return `${value.slice(0, 4)}…${value.slice(-4)}`; }

export function WalletEntryControls() {
  const [open, setOpen] = useState(false);
  const { publicKey } = useWallet();
  const { suiAddress } = useWebsiteWallet();
  const address = publicKey?.toBase58() ?? suiAddress;
  return (
    <>
      <button type="button" className="web-button web-button-secondary hidden sm:inline-flex" onClick={() => setOpen(true)}>{address ? shortAddress(address) : "Connect"}</button>
      <Link href="/open/dashboard" className="web-button web-button-primary">Open app</Link>
      <WalletConnectModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
