-- PowerChain Bridge 1.0.0: bind claim submission retries to one canonical idempotency key.
ALTER TABLE "claims"
  ADD COLUMN "submit_idempotency_key" TEXT;

CREATE UNIQUE INDEX "claims_submit_idempotency_key_key"
  ON "claims"("submit_idempotency_key")
  WHERE "submit_idempotency_key" IS NOT NULL;
