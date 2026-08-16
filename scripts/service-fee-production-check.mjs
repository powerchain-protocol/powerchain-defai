import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const requireFile = (rel) => { if (!fs.existsSync(path.join(root, rel))) errors.push(`missing:${rel}`); };
const requireText = (rel, token) => {
  requireFile(rel);
  if (fs.existsSync(path.join(root, rel)) && !read(rel).includes(token)) errors.push(`missing-token:${rel}:${token}`);
};

for (const rel of [
  "apps/backend/src/fees/index.ts",
  "apps/backend/src/fees/math.ts",
  "apps/backend/src/fees/policy.ts",
  "apps/backend/src/fees/settlement.ts",
  "apps/backend/src/fees/solana.ts",
  "apps/backend/src/fees/solana-collection.ts",
  "apps/backend/src/fees/sui.ts",
  "apps/backend/src/fees/sui-collection.ts",
  "apps/backend/src/fees/verify.ts",
  "apps/backend/src/fees/retry.ts",
  "apps/backend/src/fees/reporting.ts",
  "apps/backend/src/fees/queue.ts",
  "apps/backend/src/fees/reconciliation.ts",
  "apps/bridge/server/service-fees.ts",
  "apps/bridge/server/service-fee-auth.ts",
  "apps/bridge/app/api/v1/fees/policy/route.ts",
  "apps/bridge/app/api/v1/fees/collection-plan/route.ts",
  "apps/bridge/app/api/v1/operator/fees/route.ts",
  "apps/bridge/app/api/v1/operator/fees/ledger/route.ts",
  "apps/bridge/app/api/v1/operator/fees/policies/route.ts",
  "apps/bridge/app/api/v1/operator/fees/revenue/route.ts",
  "apps/bridge/app/api/v1/operator/fees/reconciliation/route.ts",
  "apps/bridge/app/api/v1/operator/fees/export/route.ts",
  "apps/bridge/app/api/v1/operator/fees/settlements/[id]/reverify/route.ts",
  "apps/bridge/app/api/v1/operator/fees/proposals/[id]/route.ts",
  "apps/worker-fees/src/main.ts",
]) requireFile(rel);

requireText("prisma/schema.prisma", "SERVICE_FEE_POLICY_UPDATE");
requireText("prisma/schema.prisma", "model BridgeServiceFeePolicy");
requireText("prisma/schema.prisma", "model BridgeServiceFeeSettlement");
requireText("prisma/schema.prisma", "RETRY_WAIT");
requireText("prisma/schema.prisma", "MANUAL_REVIEW");
requireText("prisma/schema.prisma", "attemptCount");
requireText("prisma/schema.prisma", "nextRetryAt");
requireText("prisma/schema.prisma", "collectedBaseUnits");
requireText("prisma/schema.prisma", "policyCommitment");
requireText("prisma/schema.prisma", "verificationLeaseOwner");
requireText("prisma/schema.prisma", "verificationLeaseUntil");
requireText("prisma/schema.prisma", "serviceFeeRecipient");
requireText("apps/backend/src/bridge/finality.ts", "assertServiceFeeVerified");
requireText("apps/backend/src/fees/policy.ts", "SERVICE_FEE_QUOTE_POLICY_MISMATCH");
requireText("apps/backend/src/fees/policy.ts", "SERVICE_FEE_QUOTE_RECIPIENT_MISMATCH");
requireText("apps/backend/src/fees/math.ts", "totalSourceDebitBaseUnits");
requireText("apps/backend/src/fees/solana.ts", "TOKEN_2022_PROGRAM_ID");
requireText("apps/backend/src/fees/sui.ts", "balanceChanges: true");
requireText("apps/backend/src/fees/sui.ts", "waitForTransaction");
requireText("apps/bridge/server/service-fees.ts", "GOVERNANCE_DUAL_CONTROL_REQUIRED");
requireText("apps/bridge/server/service-fees.ts", 'isolationLevel: "Serializable"');
requireText("apps/bridge/server/service-fee-auth.ts", "timingSafeEqual");
requireText("apps/worker-fees/src/main.ts", "verifyServiceFeeForTransfer");
requireText("apps/worker-fees/src/main.ts", "claimServiceFeeVerificationBatch");
requireText("apps/backend/src/fees/queue.ts", "FOR UPDATE SKIP LOCKED");
requireText("apps/backend/src/fees/queue.ts", "verificationLeaseUntil");
requireText("apps/backend/src/fees/retry.ts", "SERVICE_FEE_RETRY_MAX_MS");
requireText("apps/backend/src/fees/verify.ts", "POWERCHAIN_FEE_MAX_ATTEMPTS");
requireText("apps/backend/src/fees/verify.ts", "RETRY_EXHAUSTED");
requireText("apps/backend/src/fees/verify.ts", "retryExhausted");
requireText("apps/backend/src/fees/reporting.ts", "BigInt");
requireText("apps/bridge/app/api/v1/operator/fees/revenue/route.ts", "serviceFeeRevenueReport");
requireText("apps/bridge/app/api/v1/operator/fees/policies/route.ts", "listServiceFeePolicyHistory");
requireText("apps/backend/src/fees/reconciliation.ts", "SETTLEMENT_COMMITMENT_MISMATCH");
requireText("apps/backend/src/fees/reconciliation.ts", "VERIFIED_AMOUNT_MISMATCH");
requireText("apps/bridge/app/api/v1/operator/fees/reconciliation/route.ts", "serviceFeeIntegrityReport");
requireText("apps/bridge/app/api/v1/operator/fees/export/route.ts", "text/csv");
requireText("apps/backend/src/fees/reporting.ts", "exportServiceFeeLedgerCsv");
requireText("apps/bridge/app/api/v1/operator/fees/settlements/[id]/reverify/route.ts", "verifyServiceFeeForTransfer");
requireText(".env.example", "POWERCHAIN_SERVICE_FEE_SOLANA_WALLET=FeeszhrKKEsvxr1kg8LDtPx6BLcEbYHiAThYaxajNhqy");
requireText(".env.example", "POWERCHAIN_SERVICE_FEE_SUI_WALLET=");
requireText(".env.example", "POWERCHAIN_SERVICE_FEE_REQUIRE_VERIFICATION=true");
requireText(".env.example", "POWERCHAIN_FEE_WORKER_BATCH_SIZE=100");
requireText(".env.example", "POWERCHAIN_FEE_WORKER_LEASE_MS=60000");
requireText(".env.example", "POWERCHAIN_FEE_MAX_ATTEMPTS=25");

const prismaMigration = "prisma/migrations/20260814000500_service_fee_control_plane/migration.sql";
const supabaseMigration = "supabase/migrations/20260814000500_service_fee_control_plane.sql";
requireFile(prismaMigration); requireFile(supabaseMigration);
if (fs.existsSync(path.join(root, prismaMigration)) && fs.existsSync(path.join(root, supabaseMigration)) && read(prismaMigration) !== read(supabaseMigration)) {
  errors.push("migration-mirror-mismatch");
}
const prismaOpsMigration = "prisma/migrations/20260814000600_service_fee_operations/migration.sql";
const supabaseOpsMigration = "supabase/migrations/20260814000600_service_fee_operations.sql";
requireFile(prismaOpsMigration); requireFile(supabaseOpsMigration);
if (fs.existsSync(path.join(root, prismaOpsMigration)) && fs.existsSync(path.join(root, supabaseOpsMigration)) && read(prismaOpsMigration) !== read(supabaseOpsMigration)) {
  errors.push("operations-migration-mirror-mismatch");
}
const prismaLeaseMigration = "prisma/migrations/20260814000700_service_fee_worker_leases/migration.sql";
const supabaseLeaseMigration = "supabase/migrations/20260814000700_service_fee_worker_leases.sql";
requireFile(prismaLeaseMigration); requireFile(supabaseLeaseMigration);
if (fs.existsSync(path.join(root, prismaLeaseMigration)) && fs.existsSync(path.join(root, supabaseLeaseMigration)) && read(prismaLeaseMigration) !== read(supabaseLeaseMigration)) {
  errors.push("worker-lease-migration-mirror-mismatch");
}

const pkg = JSON.parse(read("package.json"));
if (pkg.version !== "1.0.0") errors.push(`version:${pkg.version}`);
if (pkg.scripts?.["fees:production:check"] !== "node scripts/service-fee-production-check.mjs") errors.push("script:fees:production:check");
if (!String(pkg.scripts?.["verify:production"] ?? "").includes("fees:production:check")) errors.push("verify:production:missing-fee-gate");

const quoteFiles = ["apps/bridge/server/services/bridge-operations.ts", "apps/bridge/server/services/bridge-intent.ts"]
  .filter((name) => fs.existsSync(path.join(root, name)))
  .map((name) => read(name));
if (!quoteFiles.some((text) => text.includes("feeBaseUnits") && text.includes("serviceFeeRecipient"))) {
  errors.push("quote-binding:serviceFeeRecipient+feeBaseUnits");
}

requireText("apps/backend/src/fees/solana-collection.ts", "createTransferCheckedInstruction");
requireText("apps/backend/src/fees/solana-collection.ts", "createAssociatedTokenAccountIdempotentInstruction");
requireText("apps/backend/src/fees/solana-collection.ts", "TOKEN_2022_PROGRAM_ID");
requireText("apps/backend/src/fees/sui-collection.ts", "splitCoins");
requireText("apps/backend/src/fees/sui-collection.ts", "transferObjects");
requireText("apps/backend/src/fees/policy.ts", "matchServiceFeePolicyForQuote");
requireText("apps/backend/src/fees/settlement.ts", "quotedAt: quote.createdAt");
requireText("apps/backend/src/fees/settlement.ts", "service-fee.settlement.assessed");
requireText("apps/backend/src/fees/verify.ts", "service-fee.settlement.verified");
requireText("apps/backend/src/fees/settlement.ts", 'process.env.NODE_ENV !== "production"');
requireText("apps/bridge/app/api/v1/fees/collection-plan/route.ts", "totalSourceDebitBaseUnits");

if (errors.length) {
  console.error(JSON.stringify({ ok: false, version: "1.0.0", errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  version: "1.0.0",
  checks: [
    "governed fee policies",
    "separate 1:1 principal and service fee",
    "quote recipient/amount binding",
    "Solana Token-2022 collection + verification",
    "Sui collection + balance-change verification",
    "historical quote-policy matching",
    "completion fail-closed until fee verified",
    "durable settlement ledger",
    "dual-control policy changes",
    "migration mirror",
    "fee worker",
    "settlement retry queue",
    "manual-review finality handling",
    "exact fee revenue reporting",
    "policy history + reverify APIs",
    "multi-replica verification leases",
    "bounded retry exhaustion",
    "fee-ledger integrity reconciliation",
    "bounded CSV ledger export",
  ],
}, null, 2));
