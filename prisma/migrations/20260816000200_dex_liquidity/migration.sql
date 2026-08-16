CREATE TYPE "DexChain" AS ENUM ('SOLANA', 'SUI');
CREATE TYPE "DexProvider" AS ENUM ('JUPITER', 'RAYDIUM', 'METEORA', 'ORCA', 'CETUS');

CREATE TABLE "dex_pool_snapshots" (
  "id" TEXT NOT NULL,
  "chain" "DexChain" NOT NULL,
  "provider" "DexProvider" NOT NULL,
  "pool_address" TEXT NOT NULL,
  "token_a" TEXT NOT NULL,
  "token_b" TEXT NOT NULL,
  "tvl_usd" DECIMAL(30,8),
  "volume_24h_usd" DECIMAL(30,8),
  "fee_rate_pct" DECIMAL(18,8),
  "source" TEXT NOT NULL,
  "observed_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dex_pool_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "dex_pool_snapshots_provider_chain_pool_address_observed_at_key" ON "dex_pool_snapshots"("provider","chain","pool_address","observed_at");
CREATE INDEX "dex_pool_snapshots_chain_provider_observed_at_idx" ON "dex_pool_snapshots"("chain","provider","observed_at");
CREATE INDEX "dex_pool_snapshots_token_a_token_b_observed_at_idx" ON "dex_pool_snapshots"("token_a","token_b","observed_at");

CREATE TABLE "swap_route_snapshots" (
  "id" TEXT NOT NULL,
  "chain" "DexChain" NOT NULL,
  "provider" "DexProvider" NOT NULL,
  "payer" TEXT NOT NULL,
  "input_asset" TEXT NOT NULL,
  "output_asset" TEXT NOT NULL,
  "input_base_units" DECIMAL(40,0) NOT NULL,
  "output_base_units" DECIMAL(40,0) NOT NULL,
  "minimum_output_base_units" DECIMAL(40,0),
  "slippage_bps" INTEGER NOT NULL,
  "route" JSONB,
  "expires_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "swap_route_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "swap_route_snapshots_chain_provider_created_at_idx" ON "swap_route_snapshots"("chain","provider","created_at");
CREATE INDEX "swap_route_snapshots_payer_created_at_idx" ON "swap_route_snapshots"("payer","created_at");
CREATE INDEX "swap_route_snapshots_input_asset_output_asset_created_at_idx" ON "swap_route_snapshots"("input_asset","output_asset","created_at");

CREATE TABLE "liquidity_positions" (
  "id" TEXT NOT NULL,
  "wallet" TEXT NOT NULL,
  "chain" "DexChain" NOT NULL,
  "provider" "DexProvider" NOT NULL,
  "pool_address" TEXT NOT NULL,
  "position_address" TEXT NOT NULL,
  "token_a" TEXT NOT NULL,
  "token_b" TEXT NOT NULL,
  "liquidity" DECIMAL(50,0),
  "metadata" JSONB,
  "last_observed_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "liquidity_positions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "liquidity_positions_chain_provider_position_address_key" ON "liquidity_positions"("chain","provider","position_address");
CREATE INDEX "liquidity_positions_wallet_chain_provider_idx" ON "liquidity_positions"("wallet","chain","provider");
CREATE INDEX "liquidity_positions_pool_address_last_observed_at_idx" ON "liquidity_positions"("pool_address","last_observed_at");
