import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const json = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

const rootPackage = json("package.json");
const database = json("packages/database/package.json");
const backend = json("apps/backend/package.json");
const bridge = json("apps/bridge/package.json");

must(rootPackage.dependencies?.pg === "8.23.0", "root pg must be 8.23.0");
must(rootPackage.dependencies?.["@supabase/supabase-js"] === "2.110.8", "root Supabase JS must be 2.110.8");
must(rootPackage.dependencies?.["@prisma/client"] === "7.9.1", "root Prisma Client must be 7.9.1");
must(database.dependencies?.pg === "8.23.0", "database pg must be 8.23.0");
must(database.devDependencies?.["@types/pg"] === "8.20.0", "database @types/pg must be 8.20.0");
must(database.dependencies?.["@prisma/adapter-pg"] === "7.9.1", "database Prisma pg adapter must be 7.9.1");
must(database.dependencies?.["@prisma/client"] === "7.9.1", "database Prisma Client must be 7.9.1");
must(database.dependencies?.["@supabase/supabase-js"] === "2.110.8", "database Supabase JS must be 2.110.8");
must(backend.dependencies?.pg === "8.23.0", "backend pg must be 8.23.0");
must(backend.dependencies?.["@prisma/client"] === "7.9.1", "backend Prisma Client must be 7.9.1");
must(backend.dependencies?.["@supabase/supabase-js"] === "2.110.8", "backend Supabase JS must be 2.110.8");
must(backend.dependencies?.axios === "1.19.0", "backend axios must be 1.19.0");
must(bridge.dependencies?.axios === "1.19.0", "bridge axios must be 1.19.0");
must(bridge.dependencies?.["@mysten/dapp-kit-react"] === "2.1.19", "bridge dApp Kit React must be 2.1.19");

must(read("packages/database/src/supabase.ts").includes("SUPABASE_SERVICE_ROLE_KEY"), "server Supabase client must require service-role key");
must(!read("packages/database/src/supabase.ts").includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"), "Supabase service-role key must never be public");
must(read("scripts/bootstrap-env.mjs").includes("config/env.defaults"), "env bootstrap must have non-hidden fallback");
must(fs.existsSync(path.join(root, "config/env.defaults")), "config/env.defaults must exist");

for (const key of ["SUPABASE_URL=", "SUPABASE_ANON_KEY=", "SUPABASE_SERVICE_ROLE_KEY="]) {
  must(read(".env.example").includes(key), `.env.example missing ${key}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`[database-stack] ${failure}`));
  process.exit(1);
}
console.log("DATABASE_STACK_PRODUCTION_CHECK_PASS pg=8.23.0 prisma=7.9.1 supabase=2.110.8 axios=1.19.0 dapp-kit=2.1.19");
