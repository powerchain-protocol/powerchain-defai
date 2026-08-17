import { pythSuiStatus } from "../services/pyth-sui";
import { cetusIntegrationStatus } from "./dex/cetus";
import { jupiterIntegrationStatus } from "./dex/jupiter";
import { meteoraIntegrationStatus } from "./dex/meteora";
import { orcaIntegrationStatus } from "./dex/orca";
import { raydiumIntegrationStatus } from "./dex/raydium";
import { birdeyeStatus } from "./birdeye";
import { coinMarketCapStatus } from "./coinmarketcap";
import { coinGeckoStatus } from "./coingecko";
import { dexScreenerStatus } from "./dexscreener";
import { heliusStatus } from "./helius";
import { metaplexStatus } from "./metaplex";
import { tensorTradeStatus } from "./tensortrade";
export function dexIntegrationsStatus(){const jupiter=jupiterIntegrationStatus();return{
  swap:{jupiter:{...jupiter,ready:jupiter.apiKeyConfigured},cetus:cetusIntegrationStatus()},
  pools:{raydium:raydiumIntegrationStatus(),meteora:meteoraIntegrationStatus(),orca:orcaIntegrationStatus(),cetus:cetusIntegrationStatus()},
  marketData:{birdeye:birdeyeStatus(),coinmarketcap:coinMarketCapStatus(),coingecko:coinGeckoStatus(),dexscreener:dexScreenerStatus(),pythSui:pythSuiStatus()},
  solanaData:{helius:heliusStatus(),metaplex:metaplexStatus(),tensor:tensorTradeStatus()},
  routing:{SOLANA:"jupiter-swap-v2",SUI:"cetus-aggregator"},bridgeSettlement:"wormhole-ntt-only" as const,
  accountingAuthority:"persisted-chain-finality-and-ntt-reconciliation" as const
};}
