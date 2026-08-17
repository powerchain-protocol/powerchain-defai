import axios, { type AxiosInstance } from "axios";
import { POWERCHAIN_SWAP_FEE_BPS, assertMinimumOutput, canonicalSwapIntent, swapQuoteProtection } from "@powerchain/swap-core";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { normalizeSuiCoinType } from "@powerchain/blockchain";
import { USER_PAYS_TRANSACTION_FEES } from "../payments/payer";
import { getPowerChainSuiBalance } from "../sui/client";
import { persistSwapRouteSnapshot } from "../data/persistence";

const SWAP_FEE_RATE = 0.025;
const DEFAULT_TIMEOUT_MS = 12_000;

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function allowedCoinTypes(): Set<string> {
  return new Set(
    ["0x2::sui::SUI", env("NEXT_PUBLIC_POWERCHAIN_WPWRC_SUI_COIN_TYPE"), env("NEXT_PUBLIC_POWERCHAIN_SUI_USDC_COIN_TYPE")]
      .filter((value): value is string => Boolean(value))
      .map((value) => normalizeSuiCoinType(value)),
  );
}

function assertCoinType(value: string): string {
  const coinType = normalizeSuiCoinType(value);
  if (!allowedCoinTypes().has(coinType)) throw new Error("SWAP_COIN_NOT_ALLOWED");
  return coinType;
}

async function assertSourceBalance(payer: string, coinType: string, amountBaseUnits: string): Promise<void> {
  const balance = await getPowerChainSuiBalance(payer, coinType);
  const available = BigInt(balance.balanceBaseUnits);
  const required = BigInt(amountBaseUnits);
  if (available < required) throw new Error("SWAP_INSUFFICIENT_BALANCE");
  if (coinType === normalizeSuiCoinType("0x2::sui::SUI") && available <= required) throw new Error("SWAP_SUI_GAS_RESERVE_REQUIRED");
}

function feeReceiver(): string {
  const receiver = env("POWERCHAIN_SWAP_FEE_SUI_WALLET") ?? env("POWERCHAIN_SERVICE_FEE_SUI_WALLET");
  if (!receiver) throw new Error("SWAP_FEE_RECEIVER_NOT_CONFIGURED");
  return normalizeSuiAddress(receiver);
}

function trustedAdapterBaseUrl(): string {
  const configured = env("POWERCHAIN_CETUS_API_URL");
  if (!configured) throw new Error("CETUS_ADAPTER_URL_REQUIRED");
  const url = new URL(configured);
  const localhost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && localhost)) throw new Error("CETUS_ADAPTER_HTTPS_REQUIRED");
  if (url.username || url.password || url.hash || url.search) throw new Error("CETUS_ADAPTER_URL_INVALID");
  return url.toString().replace(/\/$/, "");
}

function timeoutMs(): number {
  const parsed = Number(env("POWERCHAIN_CETUS_TIMEOUT_MS") ?? DEFAULT_TIMEOUT_MS);
  return Number.isFinite(parsed) ? Math.max(2_000, Math.min(30_000, Math.trunc(parsed))) : DEFAULT_TIMEOUT_MS;
}

function adapterClient(): AxiosInstance {
  const apiKey = env("POWERCHAIN_CETUS_API_KEY");
  return axios.create({
    baseURL: trustedAdapterBaseUrl(),
    timeout: timeoutMs(),
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 300,
    headers: {
      "content-type": "application/json",
      "user-agent": "powerchain-defai/1.0.0",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
  });
}

type CetusRoutePath = Readonly<{ provider?: string }>;
export type CetusRouterData = Readonly<{
  quoteID: string;
  amountOut: string;
  insufficientLiquidity?: boolean;
  deviationRatio?: number | null;
  paths?: readonly CetusRoutePath[];
  [key: string]: unknown;
}>;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("CETUS_ADAPTER_RESPONSE_INVALID");
  return value as Record<string, unknown>;
}

function normalizeRouter(payload: unknown): CetusRouterData {
  const outer = asRecord(payload);
  const candidate = outer.router ?? outer.data ?? outer;
  const row = asRecord(candidate);
  const quoteID = String(row.quoteID ?? row.quoteId ?? "").trim();
  const amountOut = String(row.amountOut ?? row.outputAmount ?? row.amount_out ?? "").trim();
  if (!quoteID || !/^[1-9][0-9]*$/.test(amountOut)) throw new Error("CETUS_ADAPTER_QUOTE_INVALID");
  const pathsRaw = Array.isArray(row.paths) ? row.paths : [];
  const paths = pathsRaw.map((path) => {
    const item = path && typeof path === "object" ? (path as Record<string, unknown>) : {};
    const provider = String(item.provider ?? item.name ?? "").trim();
    return provider ? { provider } : {};
  });
  const deviation = Number(row.deviationRatio ?? row.priceDeviationRatio);
  return {
    ...row,
    quoteID,
    amountOut,
    insufficientLiquidity: Boolean(row.insufficientLiquidity),
    deviationRatio: Number.isFinite(deviation) ? deviation : null,
    paths,
  };
}

async function fetchCetusRoute(input: {
  payer: string;
  from: string;
  target: string;
  amount: string;
}): Promise<CetusRouterData> {
  const response = await adapterClient().post(env("POWERCHAIN_CETUS_QUOTE_PATH") ?? "/quote", {
    chain: "SUI",
    network: env("POWERCHAIN_SUI_NETWORK") === "testnet" ? "testnet" : "mainnet",
    payer: input.payer,
    from: input.from,
    target: input.target,
    amount: input.amount,
    byAmountIn: true,
    overlayFeeRate: SWAP_FEE_RATE,
    overlayFeeReceiver: feeReceiver(),
  });
  return normalizeRouter(response.data);
}

async function buildRemoteTransaction(input: {
  payer: string;
  router: CetusRouterData;
  slippageBps: number;
}): Promise<string> {
  const response = await adapterClient().post(env("POWERCHAIN_CETUS_TRANSACTION_PATH") ?? "/transaction", {
    chain: "SUI",
    network: env("POWERCHAIN_SUI_NETWORK") === "testnet" ? "testnet" : "mainnet",
    payer: input.payer,
    router: input.router,
    slippageBps: input.slippageBps,
    sponsored: false,
  });
  const body = asRecord(response.data);
  const value = String(body.transactionBase64 ?? body.transaction ?? body.txBytes ?? "").trim();
  if (!value || value.length > 2_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error("CETUS_ADAPTER_TRANSACTION_INVALID");
  return value;
}

export type CetusSwapQuoteResult = {
  router: CetusRouterData;
  quote: {
    quoteId: string;
    payer: string;
    fromCoinType: string;
    toCoinType: string;
    amountInBaseUnits: string;
    amountOutBaseUnits: string;
    minimumOutBaseUnits: string;
    slippageBps: number;
    providers: readonly string[];
    priceDeviationRatio: number | null;
    protocolFeeBps: typeof POWERCHAIN_SWAP_FEE_BPS;
    protocolFeeMode: "cetus-overlay";
    protocolFeeReceiver: string;
    userPaysNetworkFees: true;
    sponsored: false;
    expiresAt: string;
    source: "cetus-adapter";
  };
};

export async function createCetusSwapQuote(input: {
  payer: string;
  fromCoinType: string;
  toCoinType: string;
  amountBaseUnits: string;
  slippageBps: number;
}): Promise<CetusSwapQuoteResult> {
  const canonical = canonicalSwapIntent({
    chain: "SUI",
    payer: input.payer,
    inputAsset: input.fromCoinType,
    outputAsset: input.toCoinType,
    amountBaseUnits: input.amountBaseUnits,
    slippageBps: input.slippageBps,
  });
  const payer = normalizeSuiAddress(canonical.payer);
  const from = assertCoinType(canonical.inputAsset);
  const target = assertCoinType(canonical.outputAsset);
  const amount = canonical.amountBaseUnits;
  const slippageBps = canonical.slippageBps;
  await assertSourceBalance(payer, from, amount);
  const router = await fetchCetusRoute({ payer, from, target, amount });
  if (router.insufficientLiquidity || !router.quoteID) throw new Error("SWAP_ROUTE_UNAVAILABLE");
  const protection = swapQuoteProtection(router.amountOut, slippageBps);
  const quote: CetusSwapQuoteResult["quote"] = {
    quoteId: router.quoteID,
    payer,
    fromCoinType: from,
    toCoinType: target,
    amountInBaseUnits: amount,
    amountOutBaseUnits: router.amountOut,
    minimumOutBaseUnits: protection.minimumOutputBaseUnits,
    slippageBps,
    providers: Object.freeze([...new Set((router.paths ?? []).map((path) => path.provider ?? "").filter(Boolean))]),
    priceDeviationRatio: typeof router.deviationRatio === "number" && Number.isFinite(router.deviationRatio) ? router.deviationRatio : null,
    protocolFeeBps: POWERCHAIN_SWAP_FEE_BPS,
    protocolFeeMode: "cetus-overlay",
    protocolFeeReceiver: feeReceiver(),
    userPaysNetworkFees: true,
    sponsored: false,
    expiresAt: protection.expiresAt,
    source: "cetus-adapter",
  };
  await persistSwapRouteSnapshot({
    chain: "SUI",
    provider: "cetus",
    payer,
    inputAsset: from,
    outputAsset: target,
    inputBaseUnits: amount,
    outputBaseUnits: router.amountOut,
    minimumOutputBaseUnits: protection.minimumOutputBaseUnits,
    slippageBps,
    expiresAt: quote.expiresAt,
    route: { providers: [...quote.providers], quoteId: quote.quoteId, transport: "remote-cetus-adapter" },
  });
  return { router, quote };
}

export async function buildCetusSwapTransaction(input: {
  payer: string;
  fromCoinType: string;
  toCoinType: string;
  amountBaseUnits: string;
  slippageBps: number;
  requiredMinimumOutBaseUnits: string;
}): Promise<{ transactionBase64: string; quote: CetusSwapQuoteResult["quote"] }> {
  if (USER_PAYS_TRANSACTION_FEES.sponsored) throw new Error("SWAP_SPONSORING_NOT_ALLOWED");
  const result = await createCetusSwapQuote(input);
  assertMinimumOutput(result.quote.amountOutBaseUnits, input.requiredMinimumOutBaseUnits);
  const transactionBase64 = await buildRemoteTransaction({ payer: result.quote.payer, router: result.router, slippageBps: result.quote.slippageBps });
  return { transactionBase64, quote: result.quote };
}
