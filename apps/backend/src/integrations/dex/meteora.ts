import { fetchIntegrationJson } from "../http";
const DEFAULT="https://dlmm.datapi.meteora.ag";function base(){return process.env.POWERCHAIN_METEORA_API_URL?.trim().replace(/\/+$/,"")||DEFAULT}
export async function fetchMeteoraData(path=""):Promise<unknown>{return fetchIntegrationJson(`${base()}/${path.replace(/^\/+/,"")}`)}
export function meteoraIntegrationStatus(){return{provider:"meteora" as const,chain:"solana" as const,apiUrl:base(),poolDiscovery:true};}
