"use client";

import { useState } from "react";
import bs58 from "bs58";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ClaimProcessCard } from "./claim-process-card";
import { OperationRecoveryCenter } from "@/components/bridge/operation-recovery-center";
import { createIdempotencyKey, postBridgeAction } from "@/lib/actions/bridge-fetch";
import { useConnectedWallets } from "@/lib/wallet/connected-wallets";
import { useOperationJournal } from "@/hooks/use-operation-journal";
import { claimStatusRoute } from "@/config/app-routes";

type Challenge = { data: { challengeId: string; wallet: string; message: string; expiresAt: string } };
type Reserve = { data: { id: string; wallet: string; status: string; amountBaseUnits: string; reservationExpiresAt: string } };
type Submit = { data: { id: string; wallet: string; status: string; amountBaseUnits: string } };

export function ClaimPageClient() {
  const wallets = useConnectedWallets();
  const journal = useOperationJournal();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    if (!wallets.solanaAddress || !wallets.solanaSignMessage) throw new Error("SOLANA_SIGN_MESSAGE_REQUIRED");
    setBusy(true); setError(null);
    try {
      const challenge = await postBridgeAction<Challenge>("/api/v1/claims/challenge", { wallet: wallets.solanaAddress });
      const signature = await wallets.solanaSignMessage(new TextEncoder().encode(challenge.data.message));
      const reserved = await postBridgeAction<Reserve>("/api/v1/claims/reserve", {
        wallet: wallets.solanaAddress,
        challengeId: challenge.data.challengeId,
        signature: bs58.encode(signature),
      }, { idempotencyKey: createIdempotencyKey("claim-reserve") });
      journal.begin({
        kind: "claim",
        id: reserved.data.id,
        status: "RESERVED",
        walletIdentity: wallets.solanaAddress,
        statusHref: `/claims/status/${reserved.data.id}`,
        statusApiHref: `/api/v1/claims/status/${reserved.data.id}?format=operation`,
      });
      const submitted = await postBridgeAction<Submit>("/api/v1/claims/submit", {
        wallet: wallets.solanaAddress,
        claimId: reserved.data.id,
      }, { idempotencyKey: createIdempotencyKey("claim-submit") });
      journal.updateStatus(submitted.data.status === "FINALIZED" ? "FINALIZED" : submitted.data.status === "SUBMITTED" ? "SUBMITTED" : "SIGNING");
      window.location.assign(claimStatusRoute(submitted.data.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Claim request failed");
    } finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <OperationRecoveryCenter currentWalletIdentity={wallets.solanaAddress} />
    {error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
    <ClaimProcessCard
      walletAddress={wallets.solanaAddress}
      connected={wallets.solanaConnected}
      busy={busy}
      onConnect={() => document.querySelector<HTMLButtonElement>(".wallet-adapter-button")?.click()}
      onBeginClaim={() => claim()}
    />
    {!wallets.solanaConnected ? <div className="sm:hidden"><WalletMultiButton /></div> : null}
  </div>;
}
