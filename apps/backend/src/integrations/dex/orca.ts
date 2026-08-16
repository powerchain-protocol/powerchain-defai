import { fetchIntegrationJson } from "../http";
const DEFAULT="https://api.orca.so/v2/solana";function base(){return process.env.POWERCHAIN_ORCA_API_URL?.trim().replace(/\/+$/,"")||DEFAULT}
export async function fetchOrcaData(path=""):Promise<unknown>{return fetchIntegrationJson(`${base()}/${path.replace(/^\/+/,"")}`)}
export function orcaIntegrationStatus(){return{provider:"orca" as const,chain:"solana" as const,apiUrl:base(),poolDiscovery:true};}
