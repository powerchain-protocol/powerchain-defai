import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const must = (condition, message) => { if (!condition) throw new Error(message); };

const socket = read("apps/bridge/lib/realtime/reconnecting-websocket.ts");
must(socket.includes("private generation = 0"), "Realtime socket generation guard missing");
must(socket.includes("generation !== this.generation"), "Stale realtime socket events are not rejected");
must(socket.includes("socket === this.socket"), "Realtime events must bind to the active socket");
must(socket.includes("acknowledgeHeartbeatActivity"), "Realtime application activity must satisfy liveness when upstream does not emit pong frames");

const escrow = read("programs/solana/powerchain_escrow/src/lib.rs");
must(escrow.includes("AccountMeta::new(*account.key,false)"), "Escrow hook writable accounts must not forward signer privilege");
must(escrow.includes("AccountMeta::new_readonly(*account.key,false)"), "Escrow hook readonly accounts must not forward signer privilege");
must(!escrow.includes("AccountMeta::new(*account.key,account.is_signer)"), "Escrow hook still forwards signer privilege");

const database = read("packages/database/src/prisma.ts");
must(database.includes("export function getPrismaClient"), "Lazy Prisma client accessor missing");
must(database.includes("new Proxy"), "Prisma compatibility export must be lazy at module evaluation");
const dbIndex = read("packages/database/src/index.ts");
must(!dbIndex.includes('export { prisma } from "./prisma"'), "Database root must not eagerly re-export Prisma client");

console.log("runtime-hardening: PASS — generation-safe realtime, non-signing escrow hooks, lazy database boundary");
