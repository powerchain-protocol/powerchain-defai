import { buildAppHandoffUrl, type HandoffChain } from "./redirects";

export type WalletAccessIntent = Readonly<{
  slug: string;
  id?: string | null;
  chain?: HandoffChain | null;
  clusterId?: string | null;
}>;

/**
 * Website wallet access is a launch gate, not a custodial account system.
 * It never treats a connected public address as proof of authenticated identity.
 */
export function createWalletAccessHandoff(intent: WalletAccessIntent) {
  return buildAppHandoffUrl({ ...intent, source: "website-wallet-access" });
}
