import "server-only";
import { getSolanaRpc } from "../rpc/providers";
import { getPowerChainSuiBalance, probePowerChainSuiGrpc } from "@powerchain/backend";
import { baseUnitsToDecimal } from "../../lib/data/decimal";

const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const SUI_ADDRESS = /^0x[a-fA-F0-9]{64}$/;
const COIN_TYPE = /^0x[a-fA-F0-9]+::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*(?:<.*>)?$/;

function env(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function requireEnv(label: string, ...names: string[]) {
  const value = env(...names);
  if (!value) throw new Error(`${label} is not configured`);
  return value;
}

function assertSolanaAddress(value: string) {
  if (!SOLANA_ADDRESS.test(value)) throw new Error("invalid Solana address");
  return value;
}

function normalizeSuiAddress(value: string) {
  if (!SUI_ADDRESS.test(value)) throw new Error("invalid Sui address");
  return value.toLowerCase();
}

function configuredPwrcMint() {
  return assertSolanaAddress(requireEnv("PWRC Solana mint", "POWERCHAIN_PWRC_SOLANA_MINT", "PWRC_SOLANA_MINT", "SOLANA_PWRC_MINT"));
}

function configuredWpwrcCoinType() {
  const value = requireEnv("wPWRC Sui coin type", "WPWRC_SUI_COIN_TYPE", "SUI_WPWRC_COIN_TYPE");
  if (!COIN_TYPE.test(value)) throw new Error("invalid wPWRC Sui coin type");
  return value;
}

type SolanaTokenAmount = { amount: string; decimals: number; uiAmountString?: string };
type SolanaTokenAccounts = { context?: { slot?: number }; value?: Array<{ account?: { data?: { parsed?: { info?: { tokenAmount?: SolanaTokenAmount } } } } }> };
type SolanaSupply = { context?: { slot?: number }; value?: SolanaTokenAmount };
type SolanaBalance = { context?: { slot?: number }; value?: number };

function tokenAccountTotal(result: SolanaTokenAccounts) {
  let total = 0n;
  let decimals: number | undefined;
  for (const entry of result.value ?? []) {
    const tokenAmount = entry.account?.data?.parsed?.info?.tokenAmount;
    if (!tokenAmount || !/^\d+$/.test(tokenAmount.amount)) continue;
    if (decimals === undefined) decimals = tokenAmount.decimals;
    if (decimals !== tokenAmount.decimals) throw new Error("inconsistent token account decimals");
    total += BigInt(tokenAmount.amount);
  }
  return { total, decimals };
}

export async function getSolanaPwrcSnapshot(owner?: string) {
  const mint = configuredPwrcMint();
  const runtime = getSolanaRpc();
  const supply = await runtime.client.request<SolanaSupply>("getTokenSupply", [mint, { commitment: "finalized" }], {
    cacheTtlMs: 2_000,
    staleIfErrorMs: 10_000,
    requestBudgetMs: 8_000,
  });
  if (!supply.value || !/^\d+$/.test(supply.value.amount)) throw new Error("invalid Solana token supply response");
  const result: Record<string, unknown> = {
    chain: "SOLANA",
    asset: "PWRC",
    mint,
    supplyBaseUnits: supply.value.amount,
    decimals: supply.value.decimals,
    supply: baseUnitsToDecimal(supply.value.amount, supply.value.decimals),
    finalizedSlot: supply.context?.slot ?? null,
    checkedAt: new Date().toISOString(),
    source: "chain-rpc",
    authoritativeForBridgeAccounting: false,
  };
  if (!owner) return result;
  const address = assertSolanaAddress(owner);
  const [native, accounts] = await Promise.all([
    runtime.client.request<SolanaBalance>("getBalance", [address, { commitment: "finalized" }], {
      cacheTtlMs: 1_000,
      staleIfErrorMs: 5_000,
      requestBudgetMs: 8_000,
    }),
    runtime.client.request<SolanaTokenAccounts>("getTokenAccountsByOwner", [address, { mint }, { commitment: "finalized", encoding: "jsonParsed" }], {
      cacheTtlMs: 1_000,
      staleIfErrorMs: 5_000,
      requestBudgetMs: 8_000,
    }),
  ]);
  const token = tokenAccountTotal(accounts);
  const decimals = token.decimals ?? supply.value.decimals;
  result.owner = address;
  result.balanceBaseUnits = token.total.toString();
  result.balance = baseUnitsToDecimal(token.total, decimals);
  result.nativeBalanceLamports = String(native.value ?? 0);
  result.nativeBalanceSol = baseUnitsToDecimal(String(native.value ?? 0), 9);
  result.balanceContextSlot = accounts.context?.slot ?? native.context?.slot ?? null;
  return result;
}

export async function getSuiWpwrcSnapshot(owner?: string) {
  const coinType = configuredWpwrcCoinType();
  const probe = await probePowerChainSuiGrpc();
  const result: Record<string, unknown> = {
    chain: "SUI",
    asset: "wPWRC",
    coinType,
    latestCheckpoint: null,
    referenceGasPrice: probe.referenceGasPrice,
    grpcEndpointIndex: probe.endpointIndex,
    grpcEndpointCount: probe.endpointCount,
    checkedAt: probe.checkedAt,
    source: "sui-grpc",
    authoritativeForBridgeAccounting: false,
  };
  if (!owner) return result;
  const address = normalizeSuiAddress(owner);
  const [wrapped, sui] = await Promise.all([
    getPowerChainSuiBalance(address, coinType),
    getPowerChainSuiBalance(address, "0x2::sui::SUI"),
  ]);
  const wrappedBase = /^\d+$/.test(wrapped.balanceBaseUnits) ? wrapped.balanceBaseUnits : "0";
  const suiBase = /^\d+$/.test(sui.balanceBaseUnits) ? sui.balanceBaseUnits : "0";
  result.owner = address;
  result.balanceBaseUnits = wrappedBase;
  result.balance = baseUnitsToDecimal(wrappedBase, 9);
  result.coinObjectBalanceBaseUnits = wrapped.coinBalanceBaseUnits;
  result.addressBalanceBaseUnits = wrapped.addressBalanceBaseUnits;
  result.nativeBalanceMist = suiBase;
  result.nativeBalanceSui = baseUnitsToDecimal(suiBase, 9);
  return result;
}
