import { fetchIntegrationJson } from "./http";import { heliusRpcUrl } from "../config/endpoints";
function rpc(){const url=heliusRpcUrl();if(!url)throw new Error("HELIUS_OR_SOLANA_RPC_REQUIRED");return url}
export async function heliusRpc<T>(method:string,params:readonly unknown[]=[]):Promise<T>{const payload=await fetchIntegrationJson<{result?:T;error?:unknown}>(rpc(),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});if(payload.error)throw new Error("HELIUS_RPC_ERROR");if(payload.result===undefined)throw new Error("HELIUS_RPC_RESULT_MISSING");return payload.result}
export async function heliusGetAsset(assetId:string){return heliusRpc<unknown>("getAsset",[{id:assetId,displayOptions:{showFungible:true}}])}
export function heliusStatus(){return{provider:"helius" as const,rpcConfigured:Boolean(heliusRpcUrl()),apiKeyConfigured:Boolean(process.env.HELIUS_API_KEY?.trim())}}
