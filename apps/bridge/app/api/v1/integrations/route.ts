import {
  aiProviderStatus,
  cachePolicy,
  crossChainProviderPolicy,
  dexIntegrationsStatus,
  featureFlags,
  notificationStatus,
  objectStorageStatus,
  realtimePolicy,
} from "@powerchain/backend";
import { ok, requestId } from "@/server/http";
export const dynamic="force-dynamic";
export async function GET(req:Request){return ok({
  dex:dexIntegrationsStatus(),
  features:featureFlags(),
  crossChain:crossChainProviderPolicy(),
  ai:aiProviderStatus(),
  notifications:notificationStatus(),
  storage:objectStorageStatus(),
  cache:cachePolicy(),
  realtime:realtimePolicy(),
  note:"DEX integrations provide swap/liquidity routing only. Wormhole NTT remains the sole bridge principal-movement protocol for PWRC/wPWRC.",
  authoritativeForBridgeAccounting:false,
},200,requestId(req),{"Cache-Control":"no-store"});}
