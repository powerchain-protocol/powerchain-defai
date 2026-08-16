import "server-only";
import { RpcEndpointPool } from "./endpoint-pool";
import { JsonRpcClient } from "./json-rpc-client";
import { solanaRpcUrls } from "@powerchain/backend/services/rpc";

function env(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

const PUBLIC_RPC_HOSTS = new Set([
  "api.mainnet-beta.solana.com",
  "api.devnet.solana.com",
  "api.testnet.solana.com",
  "fullnode.mainnet.sui.io",
  "fullnode.testnet.sui.io",
  "fullnode.devnet.sui.io",
]);

type Chain = "SOLANA" | "SUI";
type Config = { id: string; url: string; priority: number };
type Runtime = { pool: RpcEndpointPool; client: JsonRpcClient };

function splitUrls(value: string | undefined) {
  return (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function configs(prefix: Chain): Config[] {
  const ordered = prefix === "SOLANA"
    ? solanaRpcUrls()
    : [
        env(`POWERCHAIN_${prefix}_RPC_URL`, `${prefix}_RPC_URL`),
        env(`POWERCHAIN_${prefix}_RPC_FALLBACK_URL`, `${prefix}_RPC_FALLBACK_URL`),
        ...splitUrls(env(`POWERCHAIN_${prefix}_RPC_FALLBACK_URLS`, `${prefix}_RPC_FALLBACK_URLS`)),
      ].filter((value): value is string => Boolean(value));
  const seen = new Set<string>();
  const result: Config[] = [];
  for (const value of ordered) {
    if (seen.has(value)) continue;
    seen.add(value);
    const index = result.length;
    result.push({ id: index === 0 ? `${prefix.toLowerCase()}-primary` : `${prefix.toLowerCase()}-fallback-${index}`, url: value, priority: index });
  }
  validate(prefix, result);
  return result;
}

function validate(chain: Chain, values: Config[]) {
  if (process.env.NODE_ENV !== "production") return;
  if (values.length < 2) throw new Error(`${chain} production RPC requires distinct primary and fallback endpoints`);
  const urls = values.map((entry) => new URL(entry.url));
  for (const url of urls) {
    if (url.protocol !== "https:") throw new Error(`${chain} production RPC must use https`);
    if (PUBLIC_RPC_HOSTS.has(url.hostname.toLowerCase())) throw new Error(`${chain} public/shared RPC is not allowed in production`);
  }
  if (urls[0].hostname.toLowerCase() === urls[1].hostname.toLowerCase()) {
    throw new Error(`${chain} fallback RPC must use a distinct provider host`);
  }
}

let solanaRuntime: Runtime | undefined;
let suiRuntime: Runtime | undefined;

function runtime(chain: Chain): Runtime {
  const current = chain === "SOLANA" ? solanaRuntime : suiRuntime;
  if (current) return current;
  const pool = new RpcEndpointPool(configs(chain));
  const created = { pool, client: new JsonRpcClient(pool) };
  if (chain === "SOLANA") solanaRuntime = created;
  else suiRuntime = created;
  return created;
}

export function getSolanaRpc() { return runtime("SOLANA"); }
export function getSuiRpc() { return runtime("SUI"); }
