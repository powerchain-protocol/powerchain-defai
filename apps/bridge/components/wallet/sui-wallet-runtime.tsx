"use client";

import { useEffect, useMemo, useState } from "react";
import { DAppKitProvider, useCurrentAccount, useCurrentWallet } from "@mysten/dapp-kit-react";
import { useSetSuiWalletSnapshot } from "@/context/sui-wallet-context";
import { useUserSettings } from "@/context/user-settings-context";
import { normalizeHttpEndpoint } from "@/lib/settings/storage";
import { createPowerChainSuiDAppKit, suiDAppKit } from "@/lib/wallet/sui-dapp-kit";

function SuiWalletSnapshotBridge() {
  const account = useCurrentAccount();
  const wallet = useCurrentWallet();
  const setSnapshot = useSetSuiWalletSnapshot();

  useEffect(() => {
    setSnapshot({ address: account?.address ?? null, walletName: wallet?.name ?? null });
    return () => setSnapshot({ address: null, walletName: null });
  }, [account?.address, wallet?.name, setSnapshot]);

  return null;
}

type RuntimeKitState = Readonly<{
  endpoint?: string;
  kit: typeof suiDAppKit;
}>;

/**
 * createDAppKit owns external wallet stores. Creating a new instance during
 * React render can synchronously publish into those stores and violate React's
 * render-phase update rules. Keep the canonical instance stable and only swap
 * to a custom-RPC instance from an effect after the render has committed.
 */
export function SuiWalletRuntime() {
  const { settings } = useUserSettings();
  const endpoint = useMemo(() => {
    if (!settings.connectivity.useCustomSuiRpc || !settings.connectivity.suiRpcUrl.trim()) return undefined;
    try {
      return normalizeHttpEndpoint(settings.connectivity.suiRpcUrl, {
        allowLocalDevelopment: process.env.NODE_ENV !== "production",
      });
    } catch {
      return undefined;
    }
  }, [settings.connectivity.suiRpcUrl, settings.connectivity.useCustomSuiRpc]);

  const [runtime, setRuntime] = useState<RuntimeKitState>({ kit: suiDAppKit });

  useEffect(() => {
    if (!endpoint) {
      setRuntime((current) => current.kit === suiDAppKit && current.endpoint === undefined ? current : { kit: suiDAppKit });
      return;
    }

    const nextKit = createPowerChainSuiDAppKit(endpoint);
    setRuntime({ endpoint, kit: nextKit });
  }, [endpoint]);

  return (
    <DAppKitProvider dAppKit={runtime.kit} key={runtime.endpoint ?? "canonical"}>
      <SuiWalletSnapshotBridge />
    </DAppKitProvider>
  );
}
