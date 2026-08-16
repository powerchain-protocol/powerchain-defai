import { fetchIntegrationJson } from "../http";
const READ_DEFAULT="https://api-v3.raydium.io",TRANSACTION_DEFAULT="https://transaction-v1.raydium.io";
function base(){return (process.env.POWERCHAIN_RAYDIUM_API_URL?.trim()||process.env.RAYDIUM_API?.trim()||READ_DEFAULT).replace(/\/+$/,"")}
export async function fetchRaydiumData(path=""):Promise<unknown>{return fetchIntegrationJson(`${base()}/${path.replace(/^\/+/,"")}`)}
export function raydiumIntegrationStatus(){return{provider:"raydium" as const,chain:"solana" as const,readApi:base(),transactionApi:process.env.POWERCHAIN_RAYDIUM_TRANSACTION_API_URL?.trim()||TRANSACTION_DEFAULT,ready:true};}
