import net from "node:net";

const raw = process.env.DATABASE_URL?.trim();
if (!raw) {
  console.error("[db:preflight] DATABASE_URL is not set. Initialize env files with `pnpm env:bootstrap` and configure PostgreSQL before migrations.");
  process.exit(1);
}
let url;
try { url = new URL(raw); } catch {
  console.error("[db:preflight] DATABASE_URL is not a valid URL.");
  process.exit(1);
}
if (!/^postgres(?:ql)?:$/.test(url.protocol)) {
  console.error("[db:preflight] DATABASE_URL must use postgres:// or postgresql://.");
  process.exit(1);
}
const host = url.hostname;
const port = Number(url.port || 5432);
const socket = net.createConnection({ host, port });
const timer = setTimeout(() => socket.destroy(new Error("timeout")), 2500);
socket.once("connect", () => {
  clearTimeout(timer);
  socket.end();
  console.log(`[db:preflight] PostgreSQL is reachable at ${host}:${port}.`);
});
socket.once("error", () => {
  clearTimeout(timer);
  console.error(`[db:preflight] PostgreSQL is not reachable at ${host}:${port}. Start the database or correct DATABASE_URL before running migrations. For the bundled local database run `pnpm db:local:ensure`.`);
  process.exitCode = 1;
});
