import "server-only";
import { fetchJson } from "../../lib/data/http-client";

const QUERY = `query PowerChainCoinMetadata($coinType: String!) {\n  coinMetadata(coinType: $coinType) {\n    name\n    symbol\n    description\n    decimals\n    iconUrl\n    supply\n  }\n}`;

type GraphqlResponse = {
  data?: { coinMetadata?: { name?: string; symbol?: string; description?: string | null; decimals?: number; iconUrl?: string | null; supply?: string | null } | null };
  errors?: Array<{ message?: string }>;
};

export async function getSuiCoinMetadata(coinType: string) {
  const url = process.env.POWERCHAIN_SUI_GRAPHQL_URL?.trim();
  if (!url) return null;
  const parsed = new URL(url);
  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") throw new Error("Sui GraphQL must use https in production");
  const response = await fetchJson<GraphqlResponse>(parsed, {
    method: "POST",
    timeoutMs: 8_000,
    maxAttempts: 2,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { coinType } }),
  });
  if (response.errors?.length) throw new Error(response.errors[0]?.message || "Sui GraphQL metadata query failed");
  const metadata = response.data?.coinMetadata;
  if (!metadata) return null;
  if (!Number.isInteger(metadata.decimals) || (metadata.decimals ?? -1) < 0 || (metadata.decimals ?? 99) > 30) throw new Error("invalid Sui coin metadata decimals");
  return { ...metadata, source: "sui-graphql" as const };
}

const CHAIN_IDENTIFIER_QUERY = `query PowerChainChainIdentifier {\n  chainIdentifier\n}`;

type ChainIdentifierResponse = {
  data?: { chainIdentifier?: string | null };
  errors?: Array<{ message?: string }>;
};

export async function getSuiChainIdentifier() {
  const url = process.env.POWERCHAIN_SUI_GRAPHQL_URL?.trim();
  if (!url) throw new Error("POWERCHAIN_SUI_GRAPHQL_URL is not configured");
  const parsed = new URL(url);
  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") throw new Error("Sui GraphQL must use https in production");
  const response = await fetchJson<ChainIdentifierResponse>(parsed, {
    method: "POST",
    timeoutMs: 8_000,
    maxAttempts: 2,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: CHAIN_IDENTIFIER_QUERY }),
  });
  if (response.errors?.length) throw new Error(response.errors[0]?.message || "Sui GraphQL chain identifier query failed");
  const value = response.data?.chainIdentifier?.trim();
  if (!value || !/^[A-Za-z0-9_-]{4,128}$/.test(value)) throw new Error("invalid Sui chain identifier");
  return value;
}
