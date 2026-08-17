import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const must = (condition, message) => { if (!condition) throw new Error(message); };
const pkg = readJson("package.json");
const bridge = readJson("apps/bridge/package.json");
const backend = readJson("apps/backend/package.json");
must(pkg.scripts.predev === "pnpm workspace:install:ensure", "Root dev must use the local self-healing workspace dependency ensure step");
must(pkg.scripts.build?.includes("prisma:ensure") && !pkg.scripts.build?.includes("prisma:generate"), "Root build must use idempotent prisma:ensure");
must(pkg.scripts.typecheck?.includes("prisma:ensure") && !pkg.scripts.typecheck?.includes("prisma:generate"), "Root typecheck must use idempotent prisma:ensure");
must(!pkg.scripts["dev:stack"]?.includes("@powerchain/backend"), "dev:stack must not launch backend library as a daemon");
must(pkg.scripts["predev:stack"]?.includes("workspace:install:ensure") && pkg.scripts["predev:stack"]?.includes("env:bootstrap") && pkg.scripts["predev:stack"]?.includes("prisma:ensure") && pkg.scripts["predev:stack"]?.includes("db:preflight"), "dev:stack must validate install/env/Prisma/database before fan-out");
must(pkg.scripts["dev:stack"]?.includes("@powerchain/bridge") && pkg.scripts["dev:stack"]?.includes("@powerchain/worker-bridge") && pkg.scripts["dev:stack"]?.includes("@powerchain/worker-claims") && pkg.scripts["dev:stack"]?.includes("@powerchain/worker-fees"), "dev:stack must launch web/API plus all workers");
must(pkg.scripts["build:monorepo"]?.includes("-r --if-present typecheck"), "build:monorepo must cover workspace typechecks");
must(bridge.scripts.predev?.includes("workspace:install:ensure") && bridge.scripts.predev?.includes("env:bootstrap") && bridge.scripts.predev?.includes("prisma:ensure"), "Bridge direct dev must validate install, bootstrap env and ensure Prisma");
must(bridge.scripts.prebuild?.includes("workspace:install:check") && bridge.scripts.prebuild?.includes("env:check") && bridge.scripts.prebuild?.includes("prisma:ensure") && !bridge.scripts.prebuild?.includes("env:bootstrap"), "Bridge build must validate install/env and ensure Prisma without mutating env files");
must(backend.scripts.dev?.includes("tsc --noEmit --watch"), "Backend dev must be a library typecheck/watch loop");
must(backend.scripts.predev?.includes("workspace:install:ensure") && backend.scripts.predev?.includes("prisma:ensure"), "Backend direct dev must validate install and ensure Prisma");
must(!backend.scripts.start, "Backend library must not advertise a standalone daemon start command");
for (const worker of ["worker-bridge", "worker-claims", "worker-fees"]) {
  const workerPkg = readJson(`apps/${worker}/package.json`);
  must(workerPkg.scripts.pretypecheck?.includes("workspace:install:check") && workerPkg.scripts.pretypecheck?.includes("prisma:ensure"), `${worker} pretypecheck must validate install and ensure Prisma`);
  must(workerPkg.scripts.predev?.includes("workspace:install:ensure") && workerPkg.scripts.predev?.includes("env:bootstrap") && workerPkg.scripts.predev?.includes("prisma:ensure"), `${worker} direct dev must validate install, bootstrap env and ensure Prisma`);
}
console.log("workspace-lifecycle: PASS — local dev self-heals dependencies; build/typecheck/release remain strict and idempotent");
