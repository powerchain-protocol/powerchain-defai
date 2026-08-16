import "server-only";
import { featureFlags } from "../config/runtime-features";

export interface DefaiAssistantInput {
  message: string;
  context?: Record<string, string | number | boolean | null>;
}

export interface DefaiAssistantOutput {
  content: string;
  mode: "local-advisory" | "provider";
  advisoryOnly: true;
  requiresWalletSignatureForActions: true;
}

type ProviderConfig = { id:string; url:string; key?:string; model?:string; kind:"powerchain"|"openai-compatible"|"anthropic"|"google" };

const SYSTEM_POLICY = [
  "You are the PowerChain DeFAI assistant.",
  "You may explain portfolio, swap, bridge, liquidity, staking, token, fee and risk information.",
  "Never claim to have signed, submitted, finalized or settled a transaction.",
  "Never request or expose private keys, seed phrases or provider secrets.",
  "Any executable action must be rebuilt by the typed application flow and explicitly signed by the connected wallet.",
  "Wormhole NTT is the sole PWRC/wPWRC cross-chain principal movement protocol."
].join(" ");

function localReply(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("bridge")) return "For PWRC ↔ wPWRC, use the validated Bridge flow. Wormhole NTT remains the sole cross-chain principal mover; review principal, fee categories, destination, finality, and reconciliation before completion.";
  if (text.includes("stake")) return "Staking is deployment-gated. Verify the configured program/package, vault or pool, custody model, reward source, lock/withdrawal conditions, and exact wallet signature before proceeding.";
  if (text.includes("swap")) return "For swaps, compare minimum received, slippage, source balance, route venues, protocol and PowerChain fees, and user-paid gas. A fresh quote must be rebuilt before wallet signing.";
  if (text.includes("pool") || text.includes("liquidity")) return "Pool data can help compare depth, fees and volatility, but it is observational. Review impermanent-loss exposure and route liquidity before adding or routing liquidity.";
  return "I can help plan and explain PowerChain DeFi actions. My output is advisory only; execution requires the normal validated application flow and an explicit connected-wallet signature.";
}

function providerConfig(): ProviderConfig | null {
  const custom=process.env.POWERCHAIN_AI_API_URL?.trim();
  if(custom)return{id:"powerchain",url:custom,key:process.env.POWERCHAIN_AI_API_KEY?.trim()||undefined,model:process.env.POWERCHAIN_AI_MODEL?.trim()||undefined,kind:"powerchain"};
  if(process.env.OPENROUTER_API_KEY?.trim())return{id:"openrouter",url:"https://openrouter.ai/api/v1/chat/completions",key:process.env.OPENROUTER_API_KEY.trim(),model:process.env.POWERCHAIN_AI_MODEL?.trim()||"openai/gpt-4.1-mini",kind:"openai-compatible"};
  if(process.env.OPENAI_API_KEY?.trim())return{id:"openai",url:"https://api.openai.com/v1/chat/completions",key:process.env.OPENAI_API_KEY.trim(),model:process.env.POWERCHAIN_AI_MODEL?.trim()||"gpt-4.1-mini",kind:"openai-compatible"};
  if(process.env.DEEPSEEK_API_KEY?.trim())return{id:"deepseek",url:"https://api.deepseek.com/chat/completions",key:process.env.DEEPSEEK_API_KEY.trim(),model:process.env.POWERCHAIN_AI_MODEL?.trim()||"deepseek-chat",kind:"openai-compatible"};
  if(process.env.ANTHROPIC_API_KEY?.trim())return{id:"anthropic",url:"https://api.anthropic.com/v1/messages",key:process.env.ANTHROPIC_API_KEY.trim(),model:process.env.POWERCHAIN_AI_MODEL?.trim()||"claude-sonnet-4-20250514",kind:"anthropic"};
  if(process.env.GOOGLE_API_KEY?.trim())return{id:"google",url:"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",key:process.env.GOOGLE_API_KEY.trim(),model:"gemini-2.5-flash",kind:"google"};
  return null;
}

function extractContent(kind:ProviderConfig["kind"],payload:unknown):string{
  if(!payload||typeof payload!=="object")return"";const p=payload as Record<string,unknown>;
  if(kind==="powerchain")return typeof p.content==="string"?p.content.trim():"";
  if(kind==="openai-compatible"){const choices=Array.isArray(p.choices)?p.choices:[];const first=choices[0] as Record<string,unknown>|undefined;const msg=first?.message as Record<string,unknown>|undefined;return typeof msg?.content==="string"?msg.content.trim():"";}
  if(kind==="anthropic"){const content=Array.isArray(p.content)?p.content:[];const first=content.find(x=>x&&typeof x==="object"&&(x as Record<string,unknown>).type==="text") as Record<string,unknown>|undefined;return typeof first?.text==="string"?first.text.trim():"";}
  const candidates=Array.isArray(p.candidates)?p.candidates:[];const first=candidates[0] as Record<string,unknown>|undefined;const content=first?.content as Record<string,unknown>|undefined;const parts=Array.isArray(content?.parts)?content.parts:[];const part=parts[0] as Record<string,unknown>|undefined;return typeof part?.text==="string"?part.text.trim():"";
}

async function providerRequest(config:ProviderConfig,input:DefaiAssistantInput,signal:AbortSignal){
  let headers:Record<string,string>={"content-type":"application/json"};let body:unknown;
  if(config.kind==="powerchain"){if(config.key)headers.Authorization=`Bearer ${config.key}`;body={model:config.model,system:SYSTEM_POLICY,message:input.message,context:input.context??{}};}
  else if(config.kind==="openai-compatible"){headers.Authorization=`Bearer ${config.key}`;body={model:config.model,messages:[{role:"system",content:SYSTEM_POLICY},{role:"user",content:input.message}],temperature:0.2};}
  else if(config.kind==="anthropic"){headers["x-api-key"]=config.key!;headers["anthropic-version"]="2023-06-01";body={model:config.model,max_tokens:800,system:SYSTEM_POLICY,messages:[{role:"user",content:input.message}]};}
  else {const url=new URL(config.url);url.searchParams.set("key",config.key!);config={...config,url:url.toString()};body={systemInstruction:{parts:[{text:SYSTEM_POLICY}]},contents:[{role:"user",parts:[{text:input.message}]}]};}
  const response=await fetch(config.url,{method:"POST",headers,body:JSON.stringify(body),signal,cache:"no-store"});if(!response.ok)throw new Error(`DEFAI_PROVIDER_${response.status}`);return extractContent(config.kind,await response.json());
}

export async function defaiAssistantReply(input: DefaiAssistantInput): Promise<DefaiAssistantOutput> {
  if (!featureFlags().ai) return { content: "PowerChain DeFAI assistant is disabled by runtime policy.", mode: "local-advisory", advisoryOnly: true, requiresWalletSignatureForActions: true };
  const config = providerConfig();
  if (!config) return { content: localReply(input.message), mode: "local-advisory", advisoryOnly: true, requiresWalletSignatureForActions: true };
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15_000);
  try { const content=await providerRequest(config,input,controller.signal); if(!content)throw new Error("DEFAI_PROVIDER_EMPTY"); return { content, mode: "provider", advisoryOnly: true, requiresWalletSignatureForActions: true }; }
  catch { return { content: localReply(input.message), mode: "local-advisory", advisoryOnly: true, requiresWalletSignatureForActions: true }; }
  finally { clearTimeout(timeout); }
}
