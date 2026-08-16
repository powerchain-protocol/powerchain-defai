import fs from "node:fs";
import path from "node:path";
const root=process.cwd(); let failed=0;
const text=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const ok=(condition,message)=>{console.log(`${condition?"PASS":"FAIL"} ${message}`); if(!condition) failed+=1;};
const db=text("packages/database/src/index.ts");
ok(db.includes("retrySerializableTransaction")&&db.includes('code === "P2034"')&&db.includes('code === "40001"')&&db.includes('code === "40P01"'),"bounded serializable transaction retry helper");
const bridge=text("apps/bridge/server/services/bridge-operations.ts");
ok(bridge.includes("retrySerializableTransaction")&&bridge.includes('isolationLevel: "Serializable"'),"bridge transfer creation is serializable/retry-safe");
ok(bridge.includes("QUOTE_ALREADY_USED"),"one quote cannot create competing transfers");
const claim=text("apps/backend/src/claims/service.ts");
ok(claim.includes("submitIdempotencyKey")&&claim.includes("CLAIM_SUBMIT_IDEMPOTENCY_KEY_REUSED"),"claim submit idempotency is persisted and enforced");
ok(claim.includes("retrySerializableTransaction")&&claim.match(/isolationLevel: "Serializable"/g)?.length>=2,"claim reserve/submit use retry-safe serializable transactions");
const schema=text("prisma/schema.prisma");
ok(schema.includes('submitIdempotencyKey String?')&&schema.includes('@map("submit_idempotency_key")'),"Prisma claim submit idempotency schema field");
const migration="20260815000200_claim_submit_idempotency";
ok(fs.existsSync(path.join(root,"prisma/migrations",migration,"migration.sql"))&&fs.existsSync(path.join(root,"supabase/migrations",`${migration}.sql`)),"claim submit idempotency migration mirrored");
const contract=text("apps/bridge/server/http/claim-mutation-contract.ts");
ok(contract.includes("requestId(request)")&&contract.includes("responseHeaders(id)"),"claim mutations share canonical request tracing");
for (const route of ["reserve","submit"]) { const body=text(`apps/bridge/app/api/v1/claims/${route}/route.ts`); ok(body.includes("contract.requestId")&&body.includes("responseHeaders(contract.requestId"),`claim ${route} response preserves request ID`); }
const migrations=text("scripts/check-migrations.mjs");
ok(migrations.includes("Migration bytes differ between Prisma and Supabase"),"all mirrored migrations require byte equality");
if(failed){console.error(`\n${failed} failure-safety checks failed`);process.exit(1);}
console.log("\nFailure-safety production gate PASS");
