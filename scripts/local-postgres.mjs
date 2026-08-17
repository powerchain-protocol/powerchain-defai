import { spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const composeScript = path.join(root, "scripts", "compose-dev.sh");
const action = process.argv[2] ?? "ensure";
const raw = process.env.DATABASE_URL?.trim() || "postgresql://postgres:postgres@127.1.0.1:5432/powerchain";

let databaseUrl;
try { databaseUrl = new URL(raw); } catch {
  console.error("[db:local] DATABASE_URL is not a valid URL.");
  process.exit(1);
}
if (!/^postgres(?:ql)?:$/.test(databaseUrl.protocol)) {
  console.error("[db:local] DATABASE_URL must use postgres:// or postgresql://.");
  process.exit(1);
}

const localHosts = new Set(["127.1.0.1", "localhost", "::1"]);
const host = databaseUrl.hostname;
const port = Number(databaseUrl.port || 5432);
const isLocal = localHosts.has(host);
const isDevcontainerPostgres = process.env.POWERCHAIN_DEVCONTAINER === "1" && host === "postgres";

function docker(args, { inherit = true } = {}) {
  const result = spawnSync("bash", [composeScript, ...args], {
    cwd: root,
    env: process.env,
    stdio: inherit ? "inherit" : "pipe",
    encoding: inherit ? undefined : "utf8",
  });
  if (result.error?.code === "ENOENT") {
    console.error("[db:local] bash is unavailable; cannot run the Compose wrapper.");
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result;
}

function canConnect(timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok) => { socket.destroy(); resolve(ok); };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

async function waitForDatabase() {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (await canConnect()) {
      console.log(`[db:local] PostgreSQL is reachable at ${host}:${port}.`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  console.error(`[db:local] PostgreSQL did not become reachable at ${host}:${port} within 45 seconds.`);
  process.exit(1);
}

if (action === "status") {
  if (await canConnect()) console.log(`[db:local] PostgreSQL is reachable at ${host}:${port}.`);
  else console.log(`[db:local] PostgreSQL is not reachable at ${host}:${port}.`);
  if (isLocal) docker(["ps", "postgres"]);
} else if (action === "up" || action === "ensure") {
  if (await canConnect()) {
    console.log(`[db:local] PostgreSQL is already reachable at ${host}:${port}.`);
    process.exit(0);
  }
  if (isDevcontainerPostgres) {
    console.error("[db:local] The devcontainer-managed PostgreSQL service is not reachable on the Compose network.");
    console.error("[db:local] Rebuild/reopen the dev container so the 'postgres' runService can become healthy.");
    process.exit(1);
  }
  if (!isLocal) {
    console.error(`[db:local] DATABASE_URL points to non-local host ${host}. Refusing to start the bundled local PostgreSQL service.`);
    console.error("[db:local] Start/fix that database externally or change DATABASE_URL for local development.");
    process.exit(1);
  }
  console.log("[db:local] Starting bundled PostgreSQL development service.");
  docker(["up", "-d", "postgres"]);
  await waitForDatabase();
} else if (action === "down") {
  if (isDevcontainerPostgres) {
    console.error("[db:local] PostgreSQL is managed by the Dev Containers Compose lifecycle; stop/rebuild it from VS Code or the host Compose project.");
    process.exit(1);
  }
  if (!isLocal) {
    console.error(`[db:local] DATABASE_URL points to non-local host ${host}; refusing to stop unrelated infrastructure.`);
    process.exit(1);
  }
  docker(["down"]);
} else if (action === "reset") {
  if (isDevcontainerPostgres) {
    console.error("[db:local] Refusing to reset the Dev Containers database from inside the workspace container.");
    console.error("[db:local] Use the host Compose project explicitly if a destructive reset is intended.");
    process.exit(1);
  }
  if (!isLocal) {
    console.error(`[db:local] DATABASE_URL points to non-local host ${host}; refusing destructive reset.`);
    process.exit(1);
  }
  console.warn("[db:local] Resetting local PostgreSQL volume. Local development data will be deleted.");
  docker(["down", "-v"]);
  docker(["up", "-d", "postgres"]);
  await waitForDatabase();
} else if (action === "logs") {
  if (isDevcontainerPostgres) {
    console.error("[db:local] Dev Containers owns the PostgreSQL service lifecycle; view service logs from VS Code or host Docker Compose.");
    process.exit(1);
  }
  if (!isLocal) {
    console.error(`[db:local] DATABASE_URL points to non-local host ${host}; no bundled local logs are associated with it.`);
    process.exit(1);
  }
  docker(["logs", "--tail=200", "postgres"]);
} else {
  console.error(`[db:local] Unknown action '${action}'. Use ensure|up|down|reset|status|logs.`);
  process.exit(1);
}
