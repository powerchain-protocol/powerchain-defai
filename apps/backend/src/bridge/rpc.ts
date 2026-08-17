import { PublicKey } from "@solana/web3.js";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { withPowerChainSuiClient } from "../sui/client";
import { solanaRpcRequest } from "../services/rpc";
import { directionChains, nttBridgeConfig } from "./config";
import type { BridgeChain, BridgeDirection, VerifiedChainTransaction } from "./types";

type SolanaTx = {
  slot: number;
  meta: null | { err: unknown; preTokenBalances?: SolanaTokenBalance[]; postTokenBalances?: SolanaTokenBalance[] };
  transaction: { message: { accountKeys: Array<string | { pubkey: string; signer?: boolean }>; instructions?: Array<{ programId?: string; programIdIndex?: number }> } };
};
type SolanaTokenBalance = { accountIndex: number; mint: string; owner?: string; uiTokenAmount: { amount: string; decimals: number } };
function solanaKeys(tx: SolanaTx) { return tx.transaction.message.accountKeys.map((k) => typeof k === "string" ? { pubkey:k, signer:false } : k); }
function balanceFor(list: SolanaTokenBalance[] | undefined, owner: string, mint: string) { return (list ?? []).filter((x) => x.owner === owner && x.mint === mint).reduce((n,x)=>n+BigInt(x.uiTokenAmount.amount),0n); }

async function verifySolana(txHash: string, expectedWallet: string, expectedDelta: bigint, role: "source"|"destination"): Promise<VerifiedChainTransaction> {
  const config=nttBridgeConfig(); const wallet=new PublicKey(expectedWallet).toBase58();
  const tx=await solanaRpcRequest<SolanaTx|null>("getTransaction",[txHash,{commitment:"finalized",encoding:"jsonParsed",maxSupportedTransactionVersion:0}]);
  if(!tx) throw new Error("SOURCE_TRANSACTION_NOT_FINALIZED");
  if(!tx.meta || tx.meta.err) throw new Error("SOLANA_TRANSACTION_FAILED");
  const keys=solanaKeys(tx); if(!keys.some((k)=>k.pubkey===config.solana.manager)) throw new Error("SOLANA_NTT_MANAGER_NOT_INVOKED");
  if(role==="source" && !keys.some((k)=>k.pubkey===wallet && k.signer)) throw new Error("SOLANA_SOURCE_SIGNER_MISMATCH");
  const pre=balanceFor(tx.meta.preTokenBalances,wallet,config.solana.token); const post=balanceFor(tx.meta.postTokenBalances,wallet,config.solana.token);
  const delta=role==="source" ? pre-post : post-pre;
  if(delta < expectedDelta) throw new Error(role==="source" ? "SOLANA_PRINCIPAL_DEBIT_MISMATCH" : "SOLANA_PRINCIPAL_CREDIT_MISMATCH");
  return { chain:"SOLANA",txHash,finalized:true,success:true,sender:wallet,manager:config.solana.manager,principalDeltaBaseUnits:delta.toString(),evidence:{slot:tx.slot,preBaseUnits:pre.toString(),postBaseUnits:post.toString()} };
}

type SuiBalanceChange = { coinType?: unknown; amount?: unknown; owner?: unknown };
type SuiVerifiedTransactionShape = {
  effects?: { status?: { success?: boolean } };
  transaction?: { sender?: string } & Record<string, unknown>;
  balanceChanges?: readonly SuiBalanceChange[];
};
type SuiWaitForTransactionResult = { Transaction?: SuiVerifiedTransactionShape; FailedTransaction?: SuiVerifiedTransactionShape };
function suiOwner(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  for (const key of ["AddressOwner", "addressOwner", "address"]) if (typeof record[key] === "string") return record[key] as string;
  return null;
}
async function verifySui(txHash: string, expectedWallet: string, expectedDelta: bigint, role:"source"|"destination"): Promise<VerifiedChainTransaction> {
  const config = nttBridgeConfig();
  const wallet = normalizeSuiAddress(expectedWallet);
  const rawResult = await withPowerChainSuiClient((client) => client.core.waitForTransaction({ digest: txHash, timeout: 15_000, include: { effects: true, balanceChanges: true, transaction: true } }));
  if (!rawResult || typeof rawResult !== "object") throw new Error("SUI_TRANSACTION_RESPONSE_INVALID");
  const result = rawResult as SuiWaitForTransactionResult;
  const tx = result.Transaction ?? result.FailedTransaction;
  if (!tx || result.FailedTransaction || !tx.effects?.status?.success) throw new Error("SUI_TRANSACTION_FAILED");
  const sender = normalizeSuiAddress(tx.transaction?.sender ?? "0x0");
  if (role === "source" && sender !== wallet) throw new Error("SUI_SOURCE_SIGNER_MISMATCH");
  const serialized = JSON.stringify(tx.transaction ?? {});
  if (!serialized.toLowerCase().includes(config.sui.manager.toLowerCase())) throw new Error("SUI_NTT_MANAGER_NOT_INVOKED");
  let net = 0n;
  for (const change of tx.balanceChanges ?? []) {
    const owner = suiOwner(change.owner);
    const amount = typeof change.amount === "bigint" ? change.amount : typeof change.amount === "string" && /^-?\d+$/.test(change.amount) ? BigInt(change.amount) : null;
    if (!owner || amount === null || normalizeSuiAddress(owner) !== wallet || change.coinType !== config.sui.token) continue;
    net += amount;
  }
  const delta = role === "source" ? -net : net;
  if (delta < expectedDelta) throw new Error(role === "source" ? "SUI_PRINCIPAL_DEBIT_MISMATCH" : "SUI_PRINCIPAL_CREDIT_MISMATCH");
  return { chain:"SUI", txHash, finalized:true, success:true, sender, manager:config.sui.manager, principalDeltaBaseUnits:delta.toString(), evidence:{ netWalletChangeBaseUnits:net.toString() } };
}

export async function verifyBridgeChainTransaction(input:{direction:BridgeDirection;role:"source"|"destination";txHash:string;wallet:string;principalBaseUnits:string}) {
  if(!/^\d+$/.test(input.principalBaseUnits)) throw new Error("INVALID_PRINCIPAL"); const {source,destination}=directionChains(input.direction); const chain=input.role==="source"?source:destination;
  return chain === "SOLANA" ? verifySolana(input.txHash,input.wallet,BigInt(input.principalBaseUnits),input.role) : verifySui(input.txHash,input.wallet,BigInt(input.principalBaseUnits),input.role);
}
