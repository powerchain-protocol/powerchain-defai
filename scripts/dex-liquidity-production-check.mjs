import { readFileSync, existsSync } from "node:fs";
const required=[
 "apps/backend/src/data/trusted-token-list.ts","apps/backend/src/data/pools.ts","apps/backend/src/data/persistence.ts","apps/backend/src/portfolio/fetch-portfolio.ts","apps/backend/src/liquidity.ts","apps/backend/src/swap/solana.ts",
 "apps/bridge/components/trade/multichain-swap-interface.tsx","apps/bridge/components/trade/solana-swap-interface.tsx","apps/bridge/components/assets/token-selector.tsx","apps/bridge/hooks/use-portfolio.ts","apps/bridge/hooks/use-pools.ts","apps/bridge/hooks/use-liquidity.ts","apps/bridge/lib/data/liquidity.ts",
 "apps/bridge/app/api/v1/swap/solana/order/route.ts","apps/bridge/app/api/v1/swap/solana/execute/route.ts","apps/bridge/app/api/v1/tokens/trusted/route.ts","apps/bridge/app/api/v1/pools/route.ts","apps/bridge/app/api/v1/portfolio/route.ts","apps/bridge/app/api/v1/liquidity/status/route.ts","apps/bridge/app/api/v1/liquidity/positions/route.ts",
 "prisma/migrations/20260816000200_dex_liquidity/migration.sql","supabase/migrations/20260816000200_dex_liquidity.sql","docs/DEX_SWAP_LIQUIDITY.md"
];
const errors=[];for(const file of required)if(!existsSync(file))errors.push(`missing ${file}`);
function must(file,...terms){const text=readFileSync(file,"utf8");for(const term of terms)if(!text.includes(term))errors.push(`${file} missing ${term}`)}
must("apps/backend/src/swap/solana.ts","/order","/execute","JUPITER_API_KEY","trustedToken","persistSwapRouteSnapshot","userPaysNetworkFees");
must("apps/backend/src/data/pools.ts","raydium-api-v3","meteora-dlmm-data-api","orca-public-api-v2","persistPoolSnapshots");
must("apps/backend/src/data/trusted-token-list.ts","SOLANA","SUI","token-2022","POWERCHAIN_SOLANA_USDC_MINT");
must("apps/bridge/components/trade/multichain-swap-interface.tsx","SOLANA","SUI","SolanaSwapInterface","SwapInterface");
must("apps/bridge/components/trade/solana-swap-interface.tsx","VersionedTransaction","solanaSignTransaction","Jupiter Swap V2","TokenSelector","usePortfolio");
must("prisma/schema.prisma","model DexPoolSnapshot","model SwapRouteSnapshot","model LiquidityPosition","enum DexProvider");
must("apps/bridge/components/pools/dex-pools-card.tsx","usePools","useLiquidity","Raydium LP","Meteora LP");
must("docs/DEX_SWAP_LIQUIDITY.md","Wormhole NTT remains the sole cross-chain principal-movement protocol","JUPITER_API_KEY");
if(errors.length){console.error("POWERCHAIN_DEX_LIQUIDITY_PRODUCTION_CHECK_FAILED");for(const error of errors)console.error(`- ${error}`);process.exit(1)}
console.log("POWERCHAIN_DEX_LIQUIDITY_PRODUCTION_CHECK_PASS version=1.0.0");
