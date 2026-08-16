import { configuredUrl, fetchIntegrationJson } from "./http";
function headers(){const key=process.env.TENSOR_API_KEY?.trim()||process.env.POWERCHAIN_TENSOR_API_KEY?.trim();if(!key)throw new Error("TENSOR_API_KEY_REQUIRED");return{"x-tensor-api-key":key}}
export async function fetchTensorData<T=unknown>(path:string):Promise<T>{const base=configuredUrl("POWERCHAIN_TENSOR_API_URL");return fetchIntegrationJson<T>(`${base}/${path.replace(/^\/+/,"")}`,{headers:headers()})}
export function tensorTradeStatus(){return{provider:"tensor" as const,chain:"solana" as const,configured:Boolean(process.env.POWERCHAIN_TENSOR_API_URL?.trim()&&(process.env.TENSOR_API_KEY?.trim()||process.env.POWERCHAIN_TENSOR_API_KEY?.trim())),readOnlyByDefault:true}}
