"use client";

import { useMemo, useRef, useState } from "react";
import { Buffer } from "buffer";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import type { StakingConfiguration, StakingPositionStatus, StakingStatus } from "@powerchain/staking";
import { BRIDGE_API_ENDPOINTS } from "@/backend/endpoints";

const POSITION_SEED = new TextEncoder().encode("staking-position");
const VAULT_AUTHORITY_SEED = new TextEncoder().encode("staking-vault-authority");
const PWRC_DECIMALS = 9;
const IX = Object.freeze({ initializePosition: Uint8Array.from([219,192,234,71,190,191,102,80]), stake: Uint8Array.from([206,176,202,18,200,209,179,108]), requestUnstake: Uint8Array.from([44,154,110,253,160,202,54,34]), withdrawUnstaked: Uint8Array.from([19,202,68,255,216,40,205,61]), claimRewards: Uint8Array.from([4,144,132,71,116,23,151,80]) });
type Action = "initialize" | "stake" | "unstake" | "withdraw" | "claim";
type PrimaryAction = "stake" | "unstake" | "claim";

function identifier(config: StakingConfiguration, name: StakingConfiguration["identifiers"][number]["name"]): string {
  const value = config.identifiers.find((item) => item.name === name)?.value?.trim();
  if (!value) throw new Error(`STAKING_${name.toUpperCase().replace(/-/g, "_")}_UNAVAILABLE`);
  return value;
}
function u64(value: bigint): Uint8Array { if (value < 0n || value > 0xffff_ffff_ffff_ffffn) throw new Error("STAKING_AMOUNT_OUT_OF_RANGE"); const data = new Uint8Array(8); let remaining = value; for (let i=0;i<8;i+=1){data[i]=Number(remaining&0xffn);remaining>>=8n;} return data; }
function concat(...parts: readonly Uint8Array[]): Uint8Array { const out=new Uint8Array(parts.reduce((sum,p)=>sum+p.length,0)); let offset=0; for(const part of parts){out.set(part,offset);offset+=part.length;} return out; }
function parseTokenAmount(input: string): bigint { const value=input.trim(); if(!/^(?:0|[1-9]\d*)(?:\.\d{1,9})?$/.test(value)) throw new Error("Enter a positive PWRC amount with at most 9 decimals."); const [whole="0",fraction=""]=value.split("."); const amount=(BigInt(whole)*10n**9n)+BigInt(fraction.padEnd(PWRC_DECIMALS,"0")||"0"); if(amount<=0n)throw new Error("Amount must be greater than zero."); return amount; }
function formatInputBaseUnits(value: bigint): string { const scale=10n**9n; const whole=value/scale; const fraction=(value%scale).toString().padStart(PWRC_DECIMALS,"0").replace(/0+$/,""); return fraction?`${whole}.${fraction}`:whole.toString(); }
function optionalBigInt(value: string | undefined): bigint | undefined { if (!value) return undefined; try { return BigInt(value); } catch { return undefined; } }
async function revalidateConfiguration(expected: StakingConfiguration): Promise<StakingConfiguration> {
  const response=await fetch(BRIDGE_API_ENDPOINTS.staking.status,{method:"GET",cache:"no-store",headers:{accept:"application/json"}});
  if(!response.ok)throw new Error(`Staking readiness check failed (${response.status}).`);
  const envelope=await response.json() as {data?:StakingStatus}|StakingStatus;
  const status="data" in envelope&&envelope.data?envelope.data:envelope as StakingStatus;
  const current=status.configurations.find((item)=>item.chain==="SOLANA");
  if(!current?.executable||current.paused)throw new Error("Solana staking is not currently verified and executable.");
  for(const name of ["program","config","stake-vault","reward-vault","mint","token-program"] as const){if(identifier(current,name)!==identifier(expected,name))throw new Error("Staking deployment changed since this page loaded. Refresh before signing.");}
  return current;
}

export function SolanaStakingActions({ configuration, position, walletBalanceBaseUnits, onConfirmed, onSubmitted }: { configuration: StakingConfiguration; position: StakingPositionStatus | null; walletBalanceBaseUnits?: string; onConfirmed: () => void; onSubmitted: (entry: { action: Action; signature: string; amountBaseUnits?: string }) => void }) {
  const { connection } = useConnection(); const { publicKey, sendTransaction, connected } = useWallet();
  const [amount,setAmount]=useState(""); const [tab,setTab]=useState<PrimaryAction>("stake"); const [pending,setPending]=useState<Action|null>(null); const [message,setMessage]=useState<string|null>(null); const [error,setError]=useState<string|null>(null); const inFlight=useRef(false);
  const disabled=!configuration.executable||configuration.paused===true||!connected||!publicKey||pending!==null; const positionExists=position?.exists===true;
  const walletBalance=optionalBigInt(walletBalanceBaseUnits); const activeStake=optionalBigInt(position?.snapshot?.stakedBaseUnits)??0n; const minimumStake=optionalBigInt(configuration.poolMetrics?.minStakeBaseUnits);
  const parsedAmount=useMemo(()=>{try{return amount.trim()?parseTokenAmount(amount):undefined;}catch{return undefined;}},[amount]);
  const amountError=useMemo(()=>{
    if(tab==="claim"||!amount.trim())return null;
    if(parsedAmount===undefined)return "Enter a valid PWRC amount with at most 9 decimals.";
    if(tab==="stake"&&minimumStake!==undefined&&parsedAmount<minimumStake)return "Amount is below the verified minimum stake.";
    if(tab==="stake"&&walletBalance!==undefined&&parsedAmount>walletBalance)return "Amount exceeds the connected wallet PWRC balance.";
    if(tab==="unstake"&&parsedAmount>activeStake)return "Amount exceeds the active staked position.";
    return null;
  },[activeStake,amount,minimumStake,parsedAmount,tab,walletBalance]);
  const canSubmitAmount=tab==="claim"||Boolean(parsedAmount&&amountError===null);
  const quickBase=tab==="stake"?walletBalance:activeStake;

  function setQuickAmount(percent: number) { if(quickBase===undefined||quickBase<=0n)return; const next=percent===100?quickBase:(quickBase*BigInt(percent))/100n; setAmount(formatInputBaseUnits(next)); setError(null); }

  async function execute(action: Action) {
    if(inFlight.current)return;
    if(!publicKey){setError("Connect a Solana wallet first.");return;}
    if((action==="stake"||action==="unstake")&&amountError){setError(amountError);return;}
    inFlight.current=true; setPending(action);setError(null);setMessage(null); let submittedSignature: string | undefined;
    try {
      const current=await revalidateConfiguration(configuration); const programId=new PublicKey(identifier(current,"program")); const config=new PublicKey(identifier(current,"config")); const stakeVault=new PublicKey(identifier(current,"stake-vault")); const rewardVault=new PublicKey(identifier(current,"reward-vault")); const mint=new PublicKey(identifier(current,"mint")); const tokenProgram=new PublicKey(identifier(current,"token-program")); if(!tokenProgram.equals(TOKEN_2022_PROGRAM_ID))throw new Error("Verified staking deployment is not using Token-2022.");
      const [positionAddress]=PublicKey.findProgramAddressSync([POSITION_SEED,publicKey.toBytes()],programId); const [vaultAuthority]=PublicKey.findProgramAddressSync([VAULT_AUTHORITY_SEED],programId); const ownerTokenAccount=getAssociatedTokenAddressSync(mint,publicKey,false,TOKEN_2022_PROGRAM_ID); let instruction:TransactionInstruction;
      if(action==="initialize") instruction=new TransactionInstruction({programId,data:Buffer.from(IX.initializePosition),keys:[{pubkey:config,isSigner:false,isWritable:false},{pubkey:publicKey,isSigner:true,isWritable:true},{pubkey:positionAddress,isSigner:false,isWritable:true},{pubkey:SystemProgram.programId,isSigner:false,isWritable:false}]});
      else if(action==="stake") instruction=new TransactionInstruction({programId,data:Buffer.from(concat(IX.stake,u64(parseTokenAmount(amount)))),keys:[{pubkey:config,isSigner:false,isWritable:true},{pubkey:positionAddress,isSigner:false,isWritable:true},{pubkey:publicKey,isSigner:true,isWritable:true},{pubkey:mint,isSigner:false,isWritable:false},{pubkey:ownerTokenAccount,isSigner:false,isWritable:true},{pubkey:stakeVault,isSigner:false,isWritable:true},{pubkey:TOKEN_2022_PROGRAM_ID,isSigner:false,isWritable:false}]});
      else if(action==="unstake") instruction=new TransactionInstruction({programId,data:Buffer.from(concat(IX.requestUnstake,u64(parseTokenAmount(amount)))),keys:[{pubkey:config,isSigner:false,isWritable:true},{pubkey:positionAddress,isSigner:false,isWritable:true},{pubkey:publicKey,isSigner:true,isWritable:false}]});
      else if(action==="withdraw") instruction=new TransactionInstruction({programId,data:Buffer.from(IX.withdrawUnstaked),keys:[{pubkey:config,isSigner:false,isWritable:false},{pubkey:positionAddress,isSigner:false,isWritable:true},{pubkey:publicKey,isSigner:true,isWritable:false},{pubkey:mint,isSigner:false,isWritable:false},{pubkey:ownerTokenAccount,isSigner:false,isWritable:true},{pubkey:stakeVault,isSigner:false,isWritable:true},{pubkey:vaultAuthority,isSigner:false,isWritable:false},{pubkey:TOKEN_2022_PROGRAM_ID,isSigner:false,isWritable:false}]});
      else instruction=new TransactionInstruction({programId,data:Buffer.from(IX.claimRewards),keys:[{pubkey:config,isSigner:false,isWritable:true},{pubkey:positionAddress,isSigner:false,isWritable:true},{pubkey:publicKey,isSigner:true,isWritable:false},{pubkey:mint,isSigner:false,isWritable:false},{pubkey:ownerTokenAccount,isSigner:false,isWritable:true},{pubkey:rewardVault,isSigner:false,isWritable:true},{pubkey:vaultAuthority,isSigner:false,isWritable:false},{pubkey:TOKEN_2022_PROGRAM_ID,isSigner:false,isWritable:false}]});
      const latest=await connection.getLatestBlockhash("confirmed"); const transaction=new Transaction({feePayer:publicKey,recentBlockhash:latest.blockhash}).add(instruction); const signature=await sendTransaction(transaction,connection,{skipPreflight:false,preflightCommitment:"confirmed"}); submittedSignature=signature; onSubmitted({action,signature,...((action==="stake"||action==="unstake")?{amountBaseUnits:parseTokenAmount(amount).toString()}:{})}); const confirmation=await connection.confirmTransaction({signature,...latest},"confirmed"); if(confirmation.value.err)throw new Error(`Staking transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`); setMessage(`Confirmed · ${signature}`); if(action==="stake"||action==="unstake")setAmount(""); onConfirmed();
    } catch(reason){if(submittedSignature){setMessage(`Submitted · ${submittedSignature}`);setError("Confirmation could not be established. Verify the signature before retrying this staking action.");onConfirmed();}else{setError(reason instanceof Error?reason.message:"Staking transaction failed.");}} finally{inFlight.current=false;setPending(null);}
  }

  return <div className="space-y-5">
    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[0.04]" role="tablist" aria-label="Staking action">
      {(["stake","unstake","claim"] as const).map((value)=><button key={value} type="button" role="tab" aria-selected={tab===value} onClick={()=>{setTab(value);setAmount("");setError(null);}} className={`min-h-9 rounded-lg px-4 text-xs font-semibold capitalize transition ${tab===value?"bg-[#173b2d] text-white shadow-sm dark:bg-[#d9e3de] dark:text-[#102019]":"text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}>{value}</button>)}
    </div>
    {!positionExists?<div className="rounded-2xl border border-[#bdcbc4] bg-[#f3f7f5] p-4 dark:border-[#35584a]/50 dark:bg-[#14231c]/60"><p className="text-sm font-semibold text-slate-900 dark:text-white">Initialize your staking position</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Creates the wallet-owned position PDA. No PWRC is transferred by this step.</p><button type="button" onClick={()=>void execute("initialize")} disabled={disabled} className="pc-button-primary mt-3 min-h-10 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">{pending==="initialize"?"Initializing…":"Initialize position"}</button></div>:null}
    {tab!=="claim"?<div className="space-y-2"><div className="flex items-center justify-between gap-3"><label htmlFor="staking-amount" className="text-xs font-semibold text-slate-600 dark:text-slate-300">PWRC amount</label><span className="text-[11px] text-slate-500">{tab==="stake"?`Available ${walletBalance===undefined?"—":formatInputBaseUnits(walletBalance)} PWRC`:`Active ${formatInputBaseUnits(activeStake)} PWRC`}</span></div><div className="relative"><input id="staking-amount" value={amount} onChange={(event)=>setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" aria-invalid={amountError!==null} className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-20 text-lg font-semibold text-slate-950 outline-none transition focus:border-[#557568] aria-[invalid=true]:border-red-300 dark:border-white/10 dark:bg-[#07100d] dark:text-white"/><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">PWRC</span></div><div className="flex flex-wrap gap-2">{[25,50,75,100].map((percent)=><button key={percent} type="button" onClick={()=>setQuickAmount(percent)} disabled={quickBase===undefined||quickBase<=0n} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-[#557568] hover:text-[#244b3b] disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">{percent===100?"Max":`${percent}%`}</button>)}</div>{amountError?<p className="text-xs text-red-700 dark:text-red-300">{amountError}</p>:minimumStake!==undefined&&tab==="stake"?<p className="text-[11px] text-slate-500">Verified minimum: {formatInputBaseUnits(minimumStake)} PWRC.</p>:null}</div>:null}
    <button type="button" onClick={()=>void execute(tab)} disabled={disabled||!canSubmitAmount||!positionExists} className="pc-button-primary min-h-12 w-full rounded-2xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">{pending===tab?`${tab==="stake"?"Staking":tab==="unstake"?"Requesting":"Claiming"}…`:tab==="stake"?"Stake PWRC":tab==="unstake"?"Request unstake":"Claim recorded rewards"}</button>
    {position?.snapshot&&BigInt(position.snapshot.pendingUnstakeBaseUnits)>0n?<button type="button" onClick={()=>void execute("withdraw")} disabled={disabled||position.cooldownComplete!==true} className="pc-button-light min-h-11 w-full rounded-2xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">{pending==="withdraw"?"Withdrawing…":position.cooldownComplete?"Withdraw unlocked PWRC":"Unstake cooldown active"}</button>:null}
    {!connected?<p className="text-xs text-slate-500">Connect a Solana wallet to initialize and sign staking transactions.</p>:null}
    {message?<p role="status" className="break-all rounded-xl bg-[#f0f5f2] px-3 py-2 text-xs text-[#244b3b] dark:bg-[#173b2d]/30 dark:text-[#d9e3de]">{message}</p>:null}
    {error?<p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-300">{error}</p>:null}
  </div>;
}
