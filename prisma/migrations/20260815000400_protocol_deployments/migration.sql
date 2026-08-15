CREATE TYPE "ProtocolDeploymentChain" AS ENUM ('SOLANA', 'SUI', 'CROSS_CHAIN');

CREATE TABLE "protocol_deployments" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "chain" "ProtocolDeploymentChain" NOT NULL,
  "network" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "protocol_deployments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "protocol_deployments_chain_network_name_key" ON "protocol_deployments"("chain", "network", "name");
CREATE INDEX "protocol_deployments_chain_network_enabled_idx" ON "protocol_deployments"("chain", "network", "enabled");
