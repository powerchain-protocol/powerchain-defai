-- PowerChain DeFAI 1.0.0 swap execution + portfolio snapshots
CREATE TYPE "SwapExecutionStatus" AS ENUM ('QUOTED','AWAITING_SIGNATURE','SUBMITTED','CONFIRMED','FAILED');
CREATE TABLE "swap_executions" (
  "id" TEXT PRIMARY KEY, "chain" "DexChain" NOT NULL, "provider" "DexProvider" NOT NULL, "payer" TEXT NOT NULL,
  "input_asset" TEXT NOT NULL, "output_asset" TEXT NOT NULL, "input_base_units" DECIMAL(40,0) NOT NULL,
  "quoted_output_base_units" DECIMAL(40,0), "minimum_output_base_units" DECIMAL(40,0), "fee_base_units" DECIMAL(40,0),
  "slippage_bps" INTEGER NOT NULL, "status" "SwapExecutionStatus" NOT NULL DEFAULT 'QUOTED', "transaction_digest" TEXT,
  "failure_code" TEXT, "quote_expires_at" TIMESTAMPTZ(6), "submitted_at" TIMESTAMPTZ(6), "confirmed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "swap_executions_payer_created_at_idx" ON "swap_executions"("payer","created_at");
CREATE INDEX "swap_executions_chain_provider_status_created_at_idx" ON "swap_executions"("chain","provider","status","created_at");
CREATE UNIQUE INDEX "swap_executions_transaction_digest_key" ON "swap_executions"("transaction_digest");
CREATE TABLE "wallet_balance_snapshots" (
  "id" TEXT PRIMARY KEY, "wallet" TEXT NOT NULL, "chain" "DexChain" NOT NULL, "asset" TEXT NOT NULL,
  "amount_base_units" DECIMAL(40,0) NOT NULL, "decimals" INTEGER NOT NULL, "source" TEXT NOT NULL,
  "observed_at" TIMESTAMPTZ(6) NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "wallet_balance_snapshots_wallet_chain_observed_at_idx" ON "wallet_balance_snapshots"("wallet","chain","observed_at");
CREATE INDEX "wallet_balance_snapshots_asset_observed_at_idx" ON "wallet_balance_snapshots"("asset","observed_at");
