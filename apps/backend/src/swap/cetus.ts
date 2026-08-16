import { AggregatorClient, Env, type RouterDataV3 } from "@cetusprotocol/aggregator-sdk";
import { POWERCHAIN_SWAP_FEE_BPS, assertMinimumOutput, canonicalSwapIntent, swapQuoteProtection } from "@powerchain/swap-core";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { normalizeSuiCoinType } from "@powerchain/blockchain";
import { USER_PAYS_TRANSACTION_FEES } from "../payments/payer";
import { getPowerChainSuiBalance } from "../sui/client";
import { persistSwapRouteSnapshot } from "../data/persistence";

const SWAP_FEE_RATE = 0.025;
function env(name: string): string | undefined { return process.env[name]?.trim() || undefined; }
function allowedCoinTypes(): Set<string> {
  return new Set(["0x2::sui::SUI", env("NEXT_PUBLIC_POWERCHAIN_WPWRC_SUI_COIN_TYPE"), env("NEXT_PUBLIC_POWERCHAIN_SUI_USDC_COIN_TYPE")].filter((value): value is string => Boolean(value)).map((value) => normalizeSuiCoinType(value)));
}
function assertCoinType(value: string): string { const coinType = normalizeSuiCoinType(value); if (!allowedCoinTypes().has(coinType)) throw new Error("SWAP_COIN_NOT_ALLOWED"); return coinType; }
async function assertSourceBalance(payer: string, coinType: string, amountBaseUnits: string): Promise<void> {
  const balance = await getPowerChainSuiBalance(payer, coinType);
  const available = BigInt(balance.balanceBaseUnits);
  const required = BigInt(amountBaseUnits);
  if (available < required) throw new Error("SWAP_INSUFFICIENT_BALANCE");
  if (coinType === normalizeSuiCoinType("0x2::sui::SUI") && available <= required) throw new Error("SWAP_SUI_GAS_RESERVE_REQUIRED");
}
function grpcUrl(): string { return env("POWERCHAIN_SUI_GRPC_URL") ?? "https://fullnode.mainnet.sui.io:443"; }
function feeReceiver(): string {
  const receiver = env("POWERCHAIN_SWAP_FEE_SUI_WALLET") ?? env("POWERCHAIN_SERVICE_FEE_SUI_WALLET");
  if (!receiver) throw new Error("SWAP_FEE_RECEIVER_NOT_CONFIGURED");
  return normalizeSuiAddress(receiver);
}
function client(payer: string): AggregatorClient {
  const network = env("POWERCHAIN_SUI_NETWORK") === "testnet" ? "testnet" : "mainnet";
  return new AggregatorClient({
    endpoint: env("POWERCHAIN_CETUS_API_URL"),
    apiKey: env("POWERCHAIN_CETUS_API_KEY"),
    signer: normalizeSuiAddress(payer),
    client: new SuiGrpcClient({ network, baseUrl: grpcUrl() }),
    env: network === "testnet" ? Env.Testnet : Env.Mainnet,
    overlayFeeRate: SWAP_FEE_RATE,
    overlayFeeReceiver: feeReceiver(),
  });
}

export type CetusSwapQuoteResult = {
  router: RouterDataV3;
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
    source: "cetus-aggregator";
  };
};

export async function createCetusSwapQuote(input: { payer: string; fromCoinType: string; toCoinType: string; amountBaseUnits: string; slippageBps: number }): Promise<CetusSwapQuoteResult> {
  const canonical = canonicalSwapIntent({ chain: "SUI", payer: input.payer, inputAsset: input.fromCoinType, outputAsset: input.toCoinType, amountBaseUnits: input.amountBaseUnits, slippageBps: input.slippageBps });
  const payer = normalizeSuiAddress(canonical.payer);
  const from = assertCoinType(canonical.inputAsset);
  const target = assertCoinType(canonical.outputAsset);
  const amount = canonical.amountBaseUnits;
  const slippageBps = canonical.slippageBps;
  await assertSourceBalance(payer, from, amount);
  const aggregator = client(payer);
  const router = await aggregator.findRouters({ from, target, amount, byAmountIn: true });
  if (!router || router.insufficientLiquidity || !router.quoteID) throw new Error("SWAP_ROUTE_UNAVAILABLE");
  const amountOut = router.amountOut.toString();
  if (!/^[1-9][0-9]*$/.test(amountOut)) throw new Error("SWAP_OUTPUT_INVALID");
  const protection = swapQuoteProtection(amountOut, slippageBps);
  const minimumOut = protection.minimumOutputBaseUnits;
  const quote: CetusSwapQuoteResult["quote"] = {
    quoteId: router.quoteID,
    payer,
    fromCoinType: from,
    toCoinType: target,
    amountInBaseUnits: amount,
    amountOutBaseUnits: amountOut,
    minimumOutBaseUnits: minimumOut,
    slippageBps,
    providers: Object.freeze([...new Set(router.paths.map((path) => path.provider))]),
    priceDeviationRatio: Number.isFinite(router.deviationRatio) ? router.deviationRatio : null,
    protocolFeeBps: POWERCHAIN_SWAP_FEE_BPS,
    protocolFeeMode: "cetus-overlay",
    protocolFeeReceiver: feeReceiver(),
    userPaysNetworkFees: true,
    sponsored: false,
    expiresAt: protection.expiresAt,
    source: "cetus-aggregator",
  };
  await persistSwapRouteSnapshot({ chain:"SUI", provider:"cetus", payer, inputAsset:from, outputAsset:target, inputBaseUnits:amount, outputBaseUnits:amountOut, minimumOutputBaseUnits:minimumOut, slippageBps, expiresAt:quote.expiresAt, route:{ providers:[...quote.providers], quoteId:quote.quoteId } });
  return { router, quote };
}

export async function buildCetusSwapTransaction(input: { payer: string; fromCoinType: string; toCoinType: string; amountBaseUnits: string; slippageBps: number; requiredMinimumOutBaseUnits: string }): Promise<{ transactionBase64: string; quote: CetusSwapQuoteResult["quote"] }> {
  if (USER_PAYS_TRANSACTION_FEES.sponsored) throw new Error("SWAP_SPONSORING_NOT_ALLOWED");
  const requiredMinimumOut = input.requiredMinimumOutBaseUnits;
  const result = await createCetusSwapQuote(input);
  assertMinimumOutput(result.quote.amountOutBaseUnits, requiredMinimumOut);
  const aggregator = client(result.quote.payer);
  const transaction = new Transaction();
  transaction.setSender(result.quote.payer);
  await aggregator.fastRouterSwap({ router: result.router, txb: transaction, slippage: result.quote.slippageBps / 10_000, sponsored: false });
  const bytes = await transaction.build({ client: aggregator.client });
  return { transactionBase64: Buffer.from(bytes).toString("base64"), quote: result.quote };
}
