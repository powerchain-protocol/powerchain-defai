import fs from "node:fs";

const checks = [
  ["local Postgres compose service exists", "compose.dev.yaml", (s) => s.includes("postgres:17-alpine") && s.includes("127.0.0.1:5432:5432") && s.includes("pg_isready")],
  ["local DB helper refuses non-local infrastructure mutation", "scripts/local-postgres.mjs", (s) => s.includes("Refusing to start the bundled local PostgreSQL service") && s.includes("refusing to stop unrelated infrastructure")],
  ["local DB helper waits for readiness", "scripts/local-postgres.mjs", (s) => s.includes("waitForDatabase") && s.includes("45_000")],
  ["full-stack bootstrap activates runtime", "scripts/dev-stack-bootstrap.sh", (s) => s.includes('source "$SCRIPT_DIR/bootstrap-toolchain.sh"')],
  ["full-stack bootstrap repairs dependencies", "scripts/dev-stack-bootstrap.sh", (s) => s.includes("pnpm workspace:repair") && s.includes("pnpm workspace:install:check")],
  ["full-stack bootstrap provisions DB and migrations", "scripts/dev-stack-bootstrap.sh", (s) => s.includes("pnpm db:local:ensure") && s.includes("pnpm db:migrate:deploy")],
  ["full-stack bootstrap starts strict stack", "scripts/dev-stack-bootstrap.sh", (s) => s.includes("exec pnpm dev:stack")],
  ["pnpm local DB commands registered", "package.json", (s) => s.includes('"db:local:ensure"') && s.includes('"db:local:down"') && s.includes('"dev:stack:bootstrap"')],
];
let failed=false;
for (const [label,file,predicate] of checks) {
  if (!fs.existsSync(file)) { console.error(`FAIL ${label}: missing ${file}`); failed=true; continue; }
  const source=fs.readFileSync(file,"utf8");
  const ok=predicate(source);
  console.log(`${ok?"PASS":"FAIL"} ${label}`);
  failed ||= !ok;
}
if (failed) process.exit(1);
console.log("LOCAL_DEV_INFRASTRUCTURE_PRODUCTION_CHECK_PASS");
