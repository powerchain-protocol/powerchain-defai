import { safeAction } from "../utils/safe-actions";
import { trustedTokenList } from "../data/trusted-token-list";
import { dexIntegrationsStatus } from "../integrations/status";
import { tokenInformation } from "../services/token-information";
import { getPrices, type PriceAsset } from "../services/prices";
import { getRate, type RateAsset } from "../services/rates";
import { calculateTransactionAmounts } from "../services/calculators";
import { publicSecurityPolicy } from "../services/security";
import { CURRENCIES } from "../services/currencies";
import { rpcRuntimeStatus } from "../services/rpc";
import { publicClusterRegistry, blockchainRuntimeDefinitions } from "../services/blockchains";

export const powerChainApi = {
  version: "1.0.0" as const,
  tokens: () => safeAction(async () => trustedTokenList()),
  integrations: () => safeAction(async () => dexIntegrationsStatus()),
  tokenInformation: () => safeAction(async () => tokenInformation()),
  prices: (assets: readonly PriceAsset[]) => safeAction(async () => getPrices(assets)),
  rate: (base: RateAsset, quote: RateAsset) => safeAction(async () => getRate(base, quote)),
  calculateTransaction: (input: Parameters<typeof calculateTransactionAmounts>[0]) => safeAction(async () => calculateTransactionAmounts(input)),
  securityPolicy: () => safeAction(async () => publicSecurityPolicy()),
  currencies: () => safeAction(async () => CURRENCIES),
  rpcStatus: () => safeAction(async () => rpcRuntimeStatus()),
  blockchains: () => safeAction(async () => blockchainRuntimeDefinitions()),
  clusters: () => safeAction(async () => publicClusterRegistry()),
};
