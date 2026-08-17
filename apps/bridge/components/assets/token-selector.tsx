"use client";
import type { TrustedToken } from "@/lib/tokens/trusted-token-list";
import { TokenPicker } from "./token-picker";
export function TokenSelector({tokens,value,onChange,label,disabledTokenIds=[]}:{tokens:readonly TrustedToken[];value:TrustedToken;onChange:(token:TrustedToken)=>void;label:string;disabledTokenIds?:readonly string[]}){return <TokenPicker items={tokens} value={value} onChange={(item)=>{const token=tokens.find(token=>token.id===item.id);if(token)onChange(token)}} label={label} disabledIds={disabledTokenIds}/>}
