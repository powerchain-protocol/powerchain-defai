import { PublicKey } from "@solana/web3.js";
export type SolanaPayTransfer={recipient:string;amount?:string;splToken?:string;reference?:string;label?:string;message?:string;memo?:string};
const DECIMAL=/^(?:0|[1-9]\d*)(?:\.\d{1,9})?$/;
function key(value:string,code:string){try{return new PublicKey(value.trim()).toBase58()}catch{throw new Error(code)}}
function text(value:string|undefined,max:number){const v=value?.trim();return v? v.slice(0,max):undefined}
export function buildSolanaPayUrl(input:SolanaPayTransfer){
  const recipient=key(input.recipient,"SOLANA_PAY_RECIPIENT_INVALID"); const url=new URL(`solana:${recipient}`);
  if(input.amount!==undefined){const amount=input.amount.trim();if(!DECIMAL.test(amount)||Number(amount)<=0)throw new Error("SOLANA_PAY_AMOUNT_INVALID");url.searchParams.set("amount",amount)}
  if(input.splToken)url.searchParams.set("spl-token",key(input.splToken,"SOLANA_PAY_MINT_INVALID"));
  if(input.reference)url.searchParams.set("reference",key(input.reference,"SOLANA_PAY_REFERENCE_INVALID"));
  for(const [name,value,max] of [["label",input.label,128],["message",input.message,256],["memo",input.memo,566]] as const){const safe=text(value,max);if(safe)url.searchParams.set(name,safe)}
  return url.toString();
}
