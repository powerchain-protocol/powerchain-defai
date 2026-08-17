export type PythSuiHermesOptions = Readonly<{
  endpoint: string;
  accessToken?: string;
  timeoutMs?: number;
}>;

const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_TIMEOUT_MS = 15_000;
const MAX_UPDATE_BYTES_BASE64 = 4_000_000;

function httpsEndpoint(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("PYTH_SUI_HERMES_URL_INVALID"); }
  if (url.protocol !== "https:") throw new Error("PYTH_SUI_HERMES_HTTPS_REQUIRED");
  if (url.username || url.password || url.search || url.hash) throw new Error("PYTH_SUI_HERMES_URL_UNSAFE");
  return url;
}

function requestTimeout(value: number | undefined): number {
  if (value === undefined) return DEFAULT_TIMEOUT_MS;
  if (!Number.isSafeInteger(value) || value < 1_000 || value > MAX_TIMEOUT_MS) {
    throw new Error("PYTH_SUI_HERMES_TIMEOUT_INVALID");
  }
  return value;
}

function accessTokenHeader(value: string | undefined): Readonly<Record<string, string>> {
  const token = value?.trim();
  if (!token) return {};
  if (token.length > 4_096 || /[\r\n]/.test(token)) throw new Error("PYTH_SUI_API_KEY_INVALID");
  return { authorization: `Bearer ${token}` };
}

export function normalizePythFeedId(value: string): string {
  const feed = value.trim().replace(/^0x/i, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(feed)) throw new Error("PYTH_FEED_ID_INVALID");
  return feed;
}

type HermesLatestResponse = Readonly<{
  binary?: Readonly<{
    encoding?: unknown;
    data?: unknown;
  }>;
}>;

function validateBase64Updates(payload: HermesLatestResponse): string[] {
  if (payload.binary?.encoding !== "base64" || !Array.isArray(payload.binary.data)) {
    throw new Error("PYTH_SUI_HERMES_RESPONSE_INVALID");
  }
  const updates: string[] = [];
  for (const value of payload.binary.data) {
    if (typeof value !== "string" || value.length < 1 || value.length > MAX_UPDATE_BYTES_BASE64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
      throw new Error("PYTH_SUI_HERMES_UPDATE_INVALID");
    }
    updates.push(value);
  }
  if (!updates.length) throw new Error("PYTH_SUI_HERMES_UPDATES_EMPTY");
  return updates;
}

/**
 * Fetch Pyth signed update payloads from Hermes over authenticated HTTPS.
 *
 * This deliberately does not depend on @pythnetwork/pyth-sui-js: that package
 * currently constrains Node to ^24 and carries a legacy Sui client surface.
 * PowerChain keeps all Sui RPC/transaction ownership on
 * current @mysten/sui while using Hermes only as an off-chain oracle transport.
 */
export async function fetchPythSuiSignedUpdates(
  feedIds: readonly string[],
  options: PythSuiHermesOptions,
): Promise<string[]> {
  if (!feedIds.length) throw new Error("PYTH_FEED_IDS_REQUIRED");
  if (feedIds.length > 16) throw new Error("PYTH_FEED_IDS_LIMIT_EXCEEDED");

  const endpoint = httpsEndpoint(options.endpoint);
  const url = new URL("./v2/updates/price/latest", `${endpoint.toString().replace(/\/$/, "")}/`);
  for (const value of feedIds) url.searchParams.append("ids[]", `0x${normalizePythFeedId(value)}`);
  url.searchParams.set("encoding", "base64");
  url.searchParams.set("parsed", "false");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeout(options.timeoutMs));
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        ...accessTokenHeader(options.accessToken),
      },
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) throw new Error(`PYTH_SUI_HERMES_HTTP_${response.status}`);
    const payload = await response.json() as HermesLatestResponse;
    return validateBase64Updates(payload);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("PYTH_SUI_HERMES_TIMEOUT");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
